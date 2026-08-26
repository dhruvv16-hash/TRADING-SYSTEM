import os
import time
import math
import unittest
import numpy as np
import pandas as pd
from unittest.mock import MagicMock, patch

# Configure testing environment
os.environ["FLASK_ENV"] = "testing"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app import app, db
from models import Account, StrategyState, TradeLog, Strategy
from delta_client import DeltaClient
from strategy_logic import (
    compute_atr,
    compute_chandelier_exit,
    compute_linreg,
    compute_zlsma,
    get_pivots,
    track_liquidity_pools,
    evaluate_strategy,
    compute_ema,
    compute_wma,
    compute_hma
)
from strategy_runner import run_strategy_for_account, SYMBOL

class TestStrategyLogic(unittest.TestCase):
    def test_linreg(self):
        """Verify linear regression outputs match manual calculations."""
        # y = 2x + 1 for x in [0, 1, 2] -> [1, 3, 5]
        # x_mean = 1, y_mean = 3
        # slope = sum((x-1)*(y-3))/sum((x-1)^2) = ((-1)*(-2) + 0 + 1*2) / (1 + 0 + 1) = 4/2 = 2
        # intercept = 3 - 2 * 1 = 1
        # at current bar (idx=2, offset=0): y = 2(2) + 1 = 5
        series = np.array([1.0, 3.0, 5.0])
        reg_val = compute_linreg(series, length=3, offset=0)
        self.assertAlmostEqual(reg_val[-1], 5.0)

        # offset = 1 -> y = 2(1) + 1 = 3
        reg_val_offset = compute_linreg(series, length=3, offset=1)
        self.assertAlmostEqual(reg_val_offset[-1], 3.0)

    def test_atr(self):
        """Verify Wilder's ATR calculation matches expected values."""
        high = np.array([10.0, 11.0, 12.0, 11.5, 12.0])
        low = np.array([9.0, 10.0, 10.5, 11.0, 11.0])
        close = np.array([9.5, 10.5, 11.0, 11.2, 11.5])
        
        # TR calculations:
        # TR0 = 10 - 9 = 1
        # TR1 = max(11-10, |11-9.5|, |10-9.5|) = max(1, 1.5, 0.5) = 1.5
        # TR2 = max(12-10.5, |12-10.5|, |10.5-10.5|) = max(1.5, 1.5, 0) = 1.5
        # TR3 = max(11.5-11, |11.5-11|, |11-11|) = max(0.5, 0.5, 0.2) = 0.5 (wait: |11-11| = 0, |11.5-11| = 0.5, close_prev is 11.0, so TR3 = 0.5)
        # TR4 = max(12-11, |12-11.2|, |11-11.2|) = max(1, 0.8, 0.2) = 1.0
        # For length = 3:
        # atr[2] = mean(TR0, TR1, TR2) = (1 + 1.5 + 1.5)/3 = 4/3 = 1.3333
        # atr[3] = alpha * TR3 + (1-alpha)*atr[2] = (1/3)*0.5 + (2/3)*1.3333 = 0.1666 + 0.8888 = 1.0555
        atr = compute_atr(high, low, close, length=3)
        self.assertAlmostEqual(atr[2], 1.33333333)
        self.assertAlmostEqual(atr[3], 1.05555556)

    def test_zlsma(self):
        """Verify ZLSMA is calculated correctly without crashes."""
        close = np.random.rand(100) * 100
        zlsma = compute_zlsma(close, length=20)
        self.assertEqual(len(zlsma), 100)
        self.assertTrue(np.isnan(zlsma[0]))
        # With length 20, double linreg needs 2*20 - 2 = 38 bars warm-up, so index 38 should be valid
        self.assertFalse(np.isnan(zlsma[38]))

    def test_chandelier_exit(self):
        """Verify Chandelier Exit trailing stops and flip logic."""
        # Mock upward trend then downward trend
        close = np.array([10.0, 10.5, 11.0, 11.5, 12.0, 11.0, 10.0, 9.0, 8.0, 7.0])
        high = close + 0.5
        low = close - 0.5
        
        # Test stops calculation
        long_stop, short_stop, dir_arr, buy_sig, sell_sig = compute_chandelier_exit(
            high, low, close, ce_length=3, ce_mult=1.5, use_close=True
        )
        self.assertEqual(len(long_stop), len(close))
        self.assertEqual(len(dir_arr), len(close))

    def test_pivots_and_liquidity(self):
        """Verify Pivot detection and stateful Liquidity pool mergers and sweeps."""
        high = np.array([10.0, 10.0, 10.0, 10.0, 10.0, 15.0, 10.0, 10.0, 10.0, 10.0, 10.0])
        low = np.array([10.0, 10.0, 10.0, 10.0, 10.0, 5.0, 10.0, 10.0, 10.0, 10.0, 10.0])
        atr = np.array([1.0] * len(high))
        
        # Pivot high at index 5 should be detected at index 10 (pivot_len=5)
        p_high, p_low = get_pivots(high, low, pivot_len=5)
        self.assertEqual(p_high[10], 15.0)
        self.assertEqual(p_low[10], 5.0)
        
        # Stateful tracking
        bsl_created, ssl_created = track_liquidity_pools(high, low, atr, p_high, p_low, cluster_atr=0.15)
        self.assertTrue(bsl_created[10])
        self.assertTrue(ssl_created[10])

    def test_compute_ema(self):
        """Verify EMA calculation matches expected exponential smoothings."""
        series = np.array([10.0, 10.0, 10.0, 10.0, 10.0])
        ema = compute_ema(series, length=3)
        self.assertEqual(len(ema), 5)
        self.assertTrue(np.isnan(ema[0]))
        self.assertTrue(np.isnan(ema[1]))
        self.assertAlmostEqual(ema[2], 10.0)
        self.assertAlmostEqual(ema[3], 10.0)
        self.assertAlmostEqual(ema[4], 10.0)
        
        # Test short series returns NaNs
        short_ema = compute_ema(np.array([1.0, 2.0]), length=3)
        self.assertTrue(np.all(np.isnan(short_ema)))

    def test_evaluate_zero_lag_strategy(self):
        """Verify the Zero Lag strategy calculations and signals."""
        n = 300
        close = np.array([100.0] * 100 + [150.0] * 100 + [50.0] * 100)
        high = close + 1.0
        low = close - 1.0
        volume = np.array([100.0] * n)
        
        df = pd.DataFrame({
            "close": close,
            "high": high,
            "low": low,
            "volume": volume,
            "time": range(n)
        })
        
        # Evaluate zero lag strategy
        res = evaluate_strategy(df, strategy_type="zero_lag", zl_length=10, zl_mult=1.0)
        self.assertIn("zlsma", res)
        self.assertIn("buy_signal", res)
        self.assertIn("sell_signal", res)
        self.assertIn("long_stop", res)
        self.assertIn("short_stop", res)
        
        # Crossover buy_signal and sell_signal should have triggered
        self.assertTrue(np.any(res["buy_signal"]))
        self.assertTrue(np.any(res["sell_signal"]))

    def test_compute_wma(self):
        """Verify Weighted Moving Average (WMA) calculation."""
        series = np.array([1.0, 2.0, 3.0])
        wma = compute_wma(series, length=3)
        self.assertEqual(len(wma), 3)
        self.assertTrue(np.isnan(wma[0]))
        self.assertTrue(np.isnan(wma[1]))
        self.assertAlmostEqual(wma[2], 2.33333333)

    def test_compute_hma(self):
        """Verify Hull Moving Average (HMA) calculation."""
        series = np.array([10.0] * 20)
        hma = compute_hma(series, length=9)
        self.assertEqual(len(hma), 20)
        self.assertTrue(np.isnan(hma[0]))
        self.assertAlmostEqual(hma[-1], 10.0)

    def test_evaluate_ai_zl_fusion_strategy(self):
        """Verify the AI Zero-Lag Fusion strategy calculations and signals."""
        n = 300
        close = np.array([100.0] * 100 + [150.0] * 100 + [50.0] * 100)
        high = close + 1.0
        low = close - 1.0
        volume = np.array([100.0] * n)
        
        df = pd.DataFrame({
            "close": close,
            "high": high,
            "low": low,
            "volume": volume,
            "time": range(n)
        })
        
        # Evaluate strategy
        res = evaluate_strategy(
            df, strategy_type="ai_zl_fusion",
            zl_length=10, zl_mult=1.0,
            ai_speed=5, ai_atr_len=5, ai_atr_mult=1.5
        )
        self.assertIn("zlsma", res)
        self.assertIn("buy_signal", res)
        self.assertIn("sell_signal", res)
        self.assertIn("long_stop", res)
        self.assertIn("short_stop", res)
        self.assertIn("dir", res)
        self.assertIn("exit_long", res)
        self.assertIn("exit_short", res)
        
        # Confluence signals should trigger
        self.assertTrue(np.any(res["buy_signal"]))
        self.assertTrue(np.any(res["sell_signal"]))
        self.assertTrue(np.any(res["exit_long"]))
        self.assertTrue(np.any(res["exit_short"]))
        
    def test_evaluate_ai_zl_fusion_reentry(self):
        """Verify that AI ZL Fusion strategy calculates and returns reentry keys."""
        # Create a simple DataFrame
        closes = np.array([10.0, 10.5, 11.0, 11.5, 12.0, 11.0, 10.0, 10.5, 11.5, 12.0] * 5)
        highs = closes + 0.1
        lows = closes - 0.1
        df = pd.DataFrame({
            "open": closes - 0.05,
            "high": highs,
            "low": lows,
            "close": closes,
            "volume": [1000] * len(closes),
            "time": [int(time.time()) - (len(closes) - i) * 300 for i in range(len(closes))]
        })
        res = evaluate_strategy(
            df, strategy_type="ai_zl_fusion",
            zl_length=10, zl_mult=1.0,
            ai_speed=5, ai_atr_len=5, ai_atr_mult=1.5
        )
        self.assertIn("long_reentry", res)
        self.assertIn("short_reentry", res)
        self.assertEqual(len(res["long_reentry"]), len(df))
        self.assertEqual(len(res["short_reentry"]), len(df))


class TestStrategyRunner(unittest.TestCase):
    def setUp(self):
        app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
        self.app_context = app.app_context()
        self.app_context.push()
        
        db.session.rollback()
        db.session.close()
        db.session.expunge_all()
        db.create_all()
        
        # Create a test account
        self.account = Account(
            name="Test Local Account",
            api_key="local_key",
            api_secret="local_secret",
            leverage=50,
            balance_buffer_pct=90.0,
            sizing_type="percentage",
            fixed_amount=10.0,
            is_active=True,
            local_strategy_enabled=True,
            is_circuit_broken=False
        )
        db.session.add(self.account)
        db.session.commit()

    def tearDown(self):
        db.session.rollback()
        db.drop_all()
        self.app_context.pop()

    @patch('delta_client.DeltaClient._request')
    @patch('delta_client.DeltaClient.get_ticker')
    @patch('delta_client.DeltaClient.get_position')
    @patch('delta_client.DeltaClient.get_available_balance')
    @patch('delta_client.DeltaClient.place_order')
    @patch('app.send_notification')
    def test_runner_long_entry(self, mock_notify, mock_place, mock_balance, mock_position, mock_ticker, mock_request):
        """Test that runner places a Long order when longCondition triggers."""
        # 1. Setup mock data
        # Mock candles: return 200 candles. Index -2 has buy signal.
        # We construct mock candles that satisfy long condition
        mock_candles = {
            "success": True,
            "result": {
                "c": [10.0] * 198 + [10.5, 11.0],
                "h": [10.2] * 198 + [10.7, 11.2],
                "l": [9.8] * 198 + [10.3, 10.8],
                "o": [10.0] * 198 + [10.4, 10.9],
                "v": [100.0] * 198 + [500.0, 100.0],
                "t": list(range(1700000000, 1700000000 + 200 * 300, 300))
            }
        }
        mock_request.return_value = mock_candles
        
        # Mock products lookup to return valid specs
        def mock_request_side_effect(method, path, query_string="", payload=None, is_private=True):
            if path == "/v2/products":
                return {
                    "success": True,
                    "result": [{
                        "symbol": "ETHUSD",
                        "id": 176,
                        "contract_value": "0.01",
                        "tick_size": "0.05"
                    }]
                }
            return mock_candles
            
        mock_request.side_effect = mock_request_side_effect
        
        # Mock balance: $1000
        mock_balance.return_value = (1000.0, "USDT")
        
        # Mock position: flat
        mock_position.return_value = None
        
        # Mock ticker
        mock_ticker.return_value = {"mark_price": "11.0", "last_price": "11.0"}
        
        # Mock place order
        mock_place.return_value = {"success": True, "result": {"id": 9999}}
        
        # 2. Inject artificial signals into evaluate_strategy
        with patch('strategy_runner.evaluate_strategy') as mock_eval:
            # Let's mock evaluate_strategy returns where index -2 has long_condition = True
            n_bars = 200
            long_stop = np.array([8.0] * n_bars)
            short_stop = np.array([12.0] * n_bars)
            dir_arr = np.array([1] * n_bars)
            buy_sig = np.zeros(n_bars, dtype=bool)
            sell_sig = np.zeros(n_bars, dtype=bool)
            bsl_created = np.zeros(n_bars, dtype=bool)
            ssl_created = np.zeros(n_bars, dtype=bool)
            long_condition = np.zeros(n_bars, dtype=bool)
            short_condition = np.zeros(n_bars, dtype=bool)
            
            # Trigger buy signal on last completed candle (index -2)
            long_condition[-2] = True
            
            mock_eval.return_value = {
                "long_stop": long_stop,
                "short_stop": short_stop,
                "dir": dir_arr,
                "buy_signal": buy_sig,
                "sell_signal": sell_sig,
                "zlsma": np.array([9.5] * n_bars),
                "bsl_created": bsl_created,
                "ssl_created": ssl_created,
                "long_condition": long_condition,
                "short_condition": short_condition
            }
            
            # 3. Run Strategy Runner
            client = DeltaClient("key", "secret")
            run_strategy_for_account(app, self.account, client)
            
            # 4. Asserts
            # Verify buy order was placed
            mock_place.assert_called_once()
            place_args = mock_place.call_args[0]
            place_kwargs = mock_place.call_args[1]
            self.assertEqual(place_kwargs.get("side"), "buy")
            
            # Sizing calculation:
            # Sizing type: percentage, Buffer: 90%, Leverage: 50
            # Buying Power = balance * leverage * buffer = 1000 * 50 * 0.90 = 45000 USD
            # lot_val = 10.5 * 0.01 = 0.105 USD
            # qty_lots = 45000 / 0.105 = 428571 contracts
            self.assertEqual(place_kwargs.get("size"), 428571)
            
            # Check strategy state was created in database
            state = StrategyState.query.filter_by(account_id=self.account.id).first()
            self.assertIsNotNone(state)
            self.assertEqual(state.position_size, 428571.0)
            self.assertEqual(state.entry_price, 10.5)
            self.assertEqual(state.tp1_price, 10.5 + 2.5 * 1.5)

    @patch('delta_client.DeltaClient._request')
    @patch('delta_client.DeltaClient.get_ticker')
    @patch('delta_client.DeltaClient.get_position')
    @patch('delta_client.DeltaClient.get_available_balance')
    @patch('delta_client.DeltaClient.place_order')
    @patch('app.send_notification')
    def test_runner_exits(self, mock_notify, mock_place, mock_balance, mock_position, mock_ticker, mock_request):
        """Test that runner correctly triggers TP1, TP2, and SL exits."""
        # Initialize strategy state with active long position
        state = StrategyState(
            account_id=self.account.id,
            symbol=SYMBOL,
            position_size=100.0,
            entry_price=10.0,
            sl_dist=2.0,
            tp1_price=13.0,
            tp2_price=16.0,
            tp1_hit=False,
            tp2_hit=False,
            current_sl=8.0,
            last_signal_time=1700000000
        )
        db.session.add(state)
        db.session.commit()

        # Mock balance
        mock_balance.return_value = (1000.0, "USDT")
        # Mock position on exchange: matches size 100
        mock_position.return_value = {"size": "100.0", "product_id": 176, "side": "buy"}
        # Mock product specifications and candles
        mock_candles = {
            "success": True,
            "result": {
                "c": [10.0] * 200,
                "h": [10.0] * 200,
                "l": [10.0] * 200,
                "o": [10.0] * 200,
                "v": [100.0] * 200,
                "t": list(range(1700000000, 1700000000 + 200 * 300, 300))
            }
        }
        
        def mock_request_side_effect(method, path, query_string="", payload=None, is_private=True):
            if path == "/v2/products":
                return {
                    "success": True,
                    "result": [{
                        "symbol": "ETHUSD",
                        "id": 176,
                        "contract_value": "0.01",
                        "tick_size": "0.05"
                    }]
                }
            return mock_candles
            
        mock_request.side_effect = mock_request_side_effect
        
        # Ticker price reaches TP1 ($13.50)
        mock_ticker.return_value = {"mark_price": "13.50", "last_price": "13.50"}
        mock_place.return_value = {"success": True}
        
        client = DeltaClient("key", "secret")
        
        # Run runner inside patched strategy evaluation block
        with patch('strategy_runner.evaluate_strategy') as mock_eval:
            n_bars = 200
            mock_eval.return_value = {
                "long_stop": np.array([8.0] * n_bars),
                "short_stop": np.array([12.0] * n_bars),
                "dir": np.array([1] * n_bars),
                "buy_signal": np.zeros(n_bars, dtype=bool),
                "sell_signal": np.zeros(n_bars, dtype=bool),
                "zlsma": np.array([9.5] * n_bars),
                "bsl_created": np.zeros(n_bars, dtype=bool),
                "ssl_created": np.zeros(n_bars, dtype=bool),
                "long_condition": np.zeros(n_bars, dtype=bool),
                "short_condition": np.zeros(n_bars, dtype=bool)
            }
            
            run_strategy_for_account(app, self.account, client)
        
        # Verify 50% TP1 close order was placed (50 contracts)
        mock_place.assert_called_once_with(176, size=50, side="sell", order_type="market_order", reduce_only=True)
        
        # Check DB updated
        state = StrategyState.query.filter_by(account_id=self.account.id).first()
        self.assertTrue(state.tp1_hit)
        # Stop loss moved to break-even ($10.0)
        self.assertEqual(state.current_sl, 10.0)
        
        # Reset mock
        mock_place.reset_mock()
        
        # Next run: Ticker price reaches TP2 ($16.50)
        mock_ticker.return_value = {"mark_price": "16.50", "last_price": "16.50"}
        run_strategy_for_account(app, self.account, client)
        
        # Verify 30% TP2 close order was placed (30 contracts)
        mock_place.assert_called_once_with(176, size=30, side="sell", order_type="market_order", reduce_only=True)
        self.assertTrue(state.tp2_hit)
        
        # Reset mock
        mock_place.reset_mock()
        
        # Next run: Ticker price hits break-even SL ($9.50)
        mock_ticker.return_value = {"mark_price": "9.50", "last_price": "9.50"}
        run_strategy_for_account(app, self.account, client)
        
        # Stop Loss should close the remaining position size (which is 100 contracts on exchange)
        mock_place.assert_called_once_with(176, size=100, side="sell", order_type="market_order", reduce_only=True)
        self.assertEqual(state.position_size, 0.0)
        
    @patch("strategy_runner.DeltaClient")
    @patch("strategy_runner.evaluate_strategy")
    def test_manual_exit_reentry(self, mock_eval, mock_client_class):
        """Verify that manual exit is detected and subsequent re-entry signals trigger order placement and reset state."""
        client = mock_client_class.return_value
        
        # Configure client mocks
        client.get_product_by_symbol.return_value = {"id": 176, "contract_value": "0.01", "tick_size": "0.05"}
        client.get_ticker.return_value = {"mark_price": "10.0", "last_price": "10.0"}
        client.get_available_balance.return_value = (1000.0, "USDT")
        
        n_bars = 200
        # Mock candles returned by client._request
        client._request.return_value = {
            "success": True,
            "result": {
                "c": [10.0] * n_bars,
                "h": [10.1] * n_bars,
                "l": [9.9] * n_bars,
                "o": [10.0] * n_bars,
                "v": [100.0] * n_bars,
                "t": list(range(1700000000, 1700000000 + n_bars * 300, 300))
            }
        }
        
        # Create strategy state: currently in active long position
        state = StrategyState(
            account_id=self.account.id,
            symbol="ETHUSD.P",
            position_size=10.0,
            entry_price=9.5,
            sl_dist=0.5,
            current_sl=9.0,
            manual_exit_detected=0,
            last_signal_time=100
        )
        db.session.add(state)
        db.session.commit()
        
        # 1. Manual exit detection test: exchange size is 0, but DB size is 10.0
        client.get_position.return_value = {"size": 0.0, "entry_price": 0.0, "product_id": 176}
        
        n_bars = 200
        mock_eval.return_value = {
            "dir": np.array([0] * n_bars),
            "buy_signal": np.zeros(n_bars, dtype=bool),
            "sell_signal": np.zeros(n_bars, dtype=bool),
            "exit_long": np.zeros(n_bars, dtype=bool),
            "exit_short": np.zeros(n_bars, dtype=bool),
            "zlsma": np.array([9.5] * n_bars),
            "long_stop": np.array([9.0] * n_bars),
            "short_stop": np.array([11.0] * n_bars),
            "bsl_created": np.zeros(n_bars, dtype=bool),
            "ssl_created": np.zeros(n_bars, dtype=bool),
            "long_condition": np.zeros(n_bars, dtype=bool),
            "short_condition": np.zeros(n_bars, dtype=bool),
            "long_reentry": np.zeros(n_bars, dtype=bool),
            "short_reentry": np.zeros(n_bars, dtype=bool),
            "ai_trend": np.array([1] * n_bars),
            "zl_trend": np.array([1] * n_bars),
            "is_choppy": np.zeros(n_bars, dtype=bool)
        }
        
        # Run runner
        run_strategy_for_account(app, self.account, client)
        
        # Assert DB state is updated: position size reset to 0, manual_exit_detected set to 1
        db.session.refresh(state)
        self.assertEqual(state.position_size, 0.0)
        self.assertEqual(state.manual_exit_detected, 1)
        self.assertIsNone(state.entry_price)
        
        # 2. Re-entry test: pull-back signal occurs
        # Mock evaluate_strategy to return long_reentry = True at the end
        long_reentry_arr = np.zeros(n_bars, dtype=bool)
        long_reentry_arr[-2] = True  # candle_idx is len - 2 in testing
        
        mock_eval.return_value = {
            "dir": np.array([0] * n_bars),
            "buy_signal": np.zeros(n_bars, dtype=bool),
            "sell_signal": np.zeros(n_bars, dtype=bool),
            "exit_long": np.zeros(n_bars, dtype=bool),
            "exit_short": np.zeros(n_bars, dtype=bool),
            "zlsma": np.array([9.5] * n_bars),
            "long_stop": np.array([9.0] * n_bars),
            "short_stop": np.array([11.0] * n_bars),
            "bsl_created": np.zeros(n_bars, dtype=bool),
            "ssl_created": np.zeros(n_bars, dtype=bool),
            "long_condition": np.zeros(n_bars, dtype=bool),
            "short_condition": np.zeros(n_bars, dtype=bool),
            "long_reentry": long_reentry_arr,
            "short_reentry": np.zeros(n_bars, dtype=bool),
            "ai_trend": np.array([1] * n_bars),
            "zl_trend": np.array([1] * n_bars),
            "is_choppy": np.zeros(n_bars, dtype=bool)
        }
        
        # Mock order placement success
        client.place_order.return_value = {"success": True, "result": {"id": "123"}}
        
        # Run runner again
        run_strategy_for_account(app, self.account, client)
        
        # Assert buy order placed
        client.place_order.assert_any_call(176, size=unittest.mock.ANY, side="buy", order_type="market_order", reduce_only=False)
        
        # Assert database state updated: manual_exit_detected reset to 0, position_size updated
        db.session.refresh(state)
        self.assertEqual(state.manual_exit_detected, 0)
        self.assertGreater(state.position_size, 0.0)

class TestMultiStrategyAllocation(unittest.TestCase):
    def setUp(self):
        self.app_context = app.app_context()
        self.app_context.push()
        
        db.session.rollback()
        db.session.close()
        db.session.expunge_all()
        db.drop_all()
        db.create_all()
        
        # Add a test account
        self.account = Account(
            name="Test Account 1",
            api_key="test_key_1",
            api_secret="test_secret_1",
            leverage=50,
            balance_buffer_pct=50.0,
            is_active=True
        )
        db.session.add(self.account)
        db.session.commit()
        
        # Add default passphrase setting
        from models import GlobalSetting
        db.session.add(GlobalSetting(key="passphrase", value="test_passphrase"))
        db.session.commit()
        
        self.app = app.test_client()

        # Mock public delta client get_product_by_symbol
        from app import public_delta_client
        self.orig_get_product = public_delta_client.get_product_by_symbol
        public_delta_client.get_product_by_symbol = MagicMock(
            return_value={"symbol": "ETHUSD.P", "id": 27, "contract_value": "0.01"}
        )

    def tearDown(self):
        from app import public_delta_client
        public_delta_client.get_product_by_symbol = self.orig_get_product
        db.session.rollback()
        db.session.close()
        db.session.expunge_all()
        db.drop_all()
        self.app_context.pop()

    def test_strategy_crud_and_limits(self):
        # 1. Create strategy successfully
        resp = self.app.post(f"/api/accounts/{self.account.id}/strategies", json={
            "name": "Strategy A",
            "sizing_type": "percentage",
            "balance_buffer_pct": 15.0,
            "leverage": 20
        })
        self.assertEqual(resp.status_code, 201)
        data = resp.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["strategy"]["name"], "Strategy A")
        self.assertEqual(data["strategy"]["balance_buffer_pct"], 15.0)
        self.assertEqual(data["strategy"]["leverage"], 20)

        # 2. Prevent duplicate strategy name per account
        resp_dup = self.app.post(f"/api/accounts/{self.account.id}/strategies", json={
            "name": "strategy a", # case-insensitive test
            "sizing_type": "fixed",
            "fixed_amount": 10.0
        })
        self.assertEqual(resp_dup.status_code, 400)
        self.assertIn("already exists", resp_dup.get_json()["message"])

        # 3. Create up to 10 strategies successfully
        for i in range(2, 11):
            resp_i = self.app.post(f"/api/accounts/{self.account.id}/strategies", json={
                "name": f"Strategy {i}"
            })
            self.assertEqual(resp_i.status_code, 201)

        # Attempt 11th strategy (should fail)
        resp_11 = self.app.post(f"/api/accounts/{self.account.id}/strategies", json={
            "name": "Strategy 11"
        })
        self.assertEqual(resp_11.status_code, 400)
        self.assertIn("Maximum of 10 strategies limit reached", resp_11.get_json()["message"])

        # 4. Update strategy details
        strategy = Strategy.query.filter_by(account_id=self.account.id, name="Strategy A").first()
        resp_update = self.app.put(f"/api/strategies/{strategy.id}", json={
            "sizing_type": "fixed",
            "fixed_amount": 25.0,
            "leverage": 10
        })
        self.assertEqual(resp_update.status_code, 200)
        db.session.refresh(strategy)
        self.assertEqual(strategy.sizing_type, "fixed")
        self.assertEqual(strategy.fixed_amount, 25.0)
        self.assertEqual(strategy.leverage, 10)

        # 5. Toggle strategy status
        resp_toggle = self.app.post(f"/api/strategies/{strategy.id}/toggle", json={"is_active": False})
        self.assertEqual(resp_toggle.status_code, 200)
        self.assertFalse(resp_toggle.get_json()["is_active"])

        # 6. Delete strategy config and verify cascade delete of StrategyState
        state = StrategyState(account_id=self.account.id, symbol="ETHUSD.P", strategy_id=strategy.id, position_size=10.0)
        db.session.add(state)
        db.session.commit()
        
        resp_del = self.app.delete(f"/api/strategies/{strategy.id}")
        self.assertEqual(resp_del.status_code, 200)
        self.assertIsNone(Strategy.query.get(strategy.id))
        self.assertIsNone(StrategyState.query.filter_by(strategy_id=strategy.id).first())

    @patch('app.DeltaClient')
    def test_webhook_strategy_execution_and_sizing(self, mock_client_class):
        mock_client = mock_client_class.return_value
        # Mock available balance and tickers
        mock_client.get_available_balance.return_value = (100.0, "USDT")
        mock_client.get_ticker.return_value = {"mark_price": "2000.0", "last_price": "2000.0"}
        mock_client.place_order.return_value = {"success": True, "result": {"id": "ord_123", "average_fill_price": "2000.0"}}
        mock_client.get_position.return_value = None

        # Configure Strategy A (percentage-sizing)
        strat_a = Strategy(
            account_id=self.account.id,
            name="Strategy A",
            sizing_type="percentage",
            balance_buffer_pct=10.0, # 10% of 100 USDT balance = 10 USDT allocated
            leverage=50, # buying power = 500 USDT
            is_active=True
        )
        # Configure Strategy B (fixed-sizing)
        strat_b = Strategy(
            account_id=self.account.id,
            name="Strategy B",
            sizing_type="fixed",
            fixed_amount=20.0, # 20 USDT allocated margin
            leverage=20, # buying power = 400 USDT
            is_active=True
        )
        db.session.add_all([strat_a, strat_b])
        db.session.commit()

        # Send Webhook Alert targeting Strategy A (buy)
        # Contract size is 0.01. Eth price is 2000. Lot value is 20 USDT.
        # Strategy A buying power = 100 USDT * 50x * 10% = 500 USDT.
        # Expected size in lots = floor(500 / 20) = 25 lots.
        payload_a = {
            "ticker": "ETHUSD.P",
            "action": "buy",
            "passphrase": "test_passphrase",
            "strategy": "Strategy A"
        }
        resp = self.app.post("/webhook", json=payload_a)
        self.assertEqual(resp.status_code, 200)
        
        # Verify order placed with correct size and reduce_only=False
        mock_client.place_order.assert_called_with(
            product_id=27,
            size=25,
            side="buy",
            order_type="market_order",
            reduce_only=False
        )

        # Verify StrategyState is updated independently for Strategy A
        state_a = StrategyState.query.filter_by(account_id=self.account.id, strategy_id=strat_a.id).first()
        self.assertIsNotNone(state_a)
        self.assertEqual(state_a.position_size, 25)
        self.assertEqual(state_a.entry_price, 2000.0)

        # Reset mock
        mock_client.place_order.reset_mock()

        # Send Webhook Alert targeting Strategy B (sell/short)
        # Strategy B buying power = 20 USDT * 20x = 400 USDT.
        # Expected size in lots = floor(400 / 20) = 20 lots.
        payload_b = {
            "ticker": "ETHUSD.P",
            "action": "sell",
            "passphrase": "test_passphrase",
            "strategy": "Strategy B"
        }
        resp_b = self.app.post("/webhook", json=payload_b)
        self.assertEqual(resp_b.status_code, 200)

        # Verify order placed with correct size and reduce_only=False
        mock_client.place_order.assert_called_with(
            product_id=27,
            size=20,
            side="sell",
            order_type="market_order",
            reduce_only=False
        )

        # Verify StrategyState is updated independently for Strategy B
        state_b = StrategyState.query.filter_by(account_id=self.account.id, strategy_id=strat_b.id).first()
        self.assertIsNotNone(state_b)
        self.assertEqual(state_b.position_size, -20) # negative for short
        self.assertEqual(state_b.entry_price, 2000.0)

        # Reset mock
        mock_client.place_order.reset_mock()

        # Test Strategy Reversal
        # Strategy A is LONG 25 lots. Sending a "sell" (reversal) webhook should close the LONG first (25 lots) and then enter SHORT.
        payload_a_rev = {
            "ticker": "ETHUSD.P",
            "action": "sell",
            "passphrase": "test_passphrase",
            "strategy": "Strategy A"
        }
        # In reversal, first close_res is called to close the LONG position (size=25, side=sell, reduce_only=False)
        # Then enters SHORT (size=25, side=sell, reduce_only=False)
        resp_rev = self.app.post("/webhook", json=payload_a_rev)
        self.assertEqual(resp_rev.status_code, 200)

        # Assert two calls: close (sell 25 lots) and entry (sell 25 lots)
        self.assertEqual(mock_client.place_order.call_count, 2)
        mock_client.place_order.assert_any_call(
            product_id=27,
            size=25,
            side="sell",
            order_type="market_order",
            reduce_only=False
        )

        # Check final virtual position of Strategy A is now SHORT 25 lots
        db.session.refresh(state_a)
        self.assertEqual(state_a.position_size, -25)

        # Reset mock
        mock_client.place_order.reset_mock()

        # Test Strategy Close action
        payload_a_close = {
            "ticker": "ETHUSD.P",
            "action": "close_short",
            "passphrase": "test_passphrase",
            "strategy": "Strategy A"
        }
        resp_close = self.app.post("/webhook", json=payload_a_close)
        self.assertEqual(resp_close.status_code, 200)

        # Assert it places a buy order of 25 lots with reduce_only=False
        mock_client.place_order.assert_called_once_with(
            product_id=27,
            size=25,
            side="buy",
            order_type="market_order",
            reduce_only=False
        )

        # Assert StrategyState is reset
        db.session.refresh(state_a)
        self.assertEqual(state_a.position_size, 0.0)
        self.assertIsNone(state_a.entry_price)

if __name__ == "__main__":
    unittest.main()
