import os
os.environ["FLASK_ENV"] = "testing"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import unittest
from unittest.mock import patch, MagicMock
import sys

sys.path.append('e:/ETHUSD.P')

from app import app, db
from models import Account, GlobalSetting
from loss_analyzer import check_and_analyze_consecutive_losses

class TestLossAnalyzer(unittest.TestCase):
    def setUp(self):
        # Configure app for testing
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app_context = app.app_context()
        self.app_context.push()
        
        # Build tables
        db.create_all()
        
        # Create test account
        self.account = Account(
            id=1,
            name="Test Dhruv Account",
            api_key="mock_key",
            api_secret="mock_secret",
            leverage=50,
            balance_buffer_pct=95.0,
            sizing_type="percentage",
            fixed_amount=10.0,
            is_active=True
        )
        db.session.add(self.account)
        
        # Add email settings
        db.session.add(GlobalSetting(key="email_enabled", value="true"))
        db.session.add(GlobalSetting(key="email_address", value="dhruv@example.com"))
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    @patch('loss_analyzer.DeltaClient')
    @patch('app.send_email_alert')
    @patch('loss_analyzer.analyze_trade_market_conditions')
    def test_consecutive_losses_triggers_email(self, mock_analyze, mock_send_email, mock_client_cls):
        # Setup mocks
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        mock_analyze.return_value = "• Mocked Volatility Warning<br>• Trend Mismatch"
        mock_send_email.return_value = True
        
        # 3 consecutive losses (realized_pnl < 0, net_pnl = rpnl - fees)
        mock_client.get_closed_positions.return_value = [
            {"product_id": 27, "realized_pnl": -5.0, "fee": 0.1, "closed_at": "2026-06-13 12:00:00 UTC", "side": "buy", "size": 1, "entry_price": 100, "close_price": 95},
            {"product_id": 27, "realized_pnl": -3.0, "fee": 0.1, "closed_at": "2026-06-13 11:30:00 UTC", "side": "sell", "size": 1, "entry_price": 100, "close_price": 103},
            {"product_id": 27, "realized_pnl": -2.0, "fee": 0.1, "closed_at": "2026-06-13 11:00:00 UTC", "side": "buy", "size": 1, "entry_price": 100, "close_price": 98}
        ]
        
        # Run check
        check_and_analyze_consecutive_losses(app, self.account)
        
        # Verify email was sent
        mock_send_email.assert_called_once()
        subject = mock_send_email.call_args[0][0]
        html_body = mock_send_email.call_args[1]['html_body']
        
        self.assertIn("Consecutive Losses Analysis Report", subject)
        self.assertIn("Test Dhruv Account", subject)
        self.assertIn("Mocked Volatility Warning", html_body)
        
        # Verify alert time was saved in DB
        alert_setting = GlobalSetting.query.filter_by(key="last_consecutive_loss_alert_time_1").first()
        self.assertIsNotNone(alert_setting)
        self.assertEqual(alert_setting.value, "2026-06-13 12:00:00 UTC")
        
        # Run again, verify deduplication (should not send email again)
        mock_send_email.reset_mock()
        check_and_analyze_consecutive_losses(app, self.account)
        mock_send_email.assert_not_called()

    @patch('loss_analyzer.DeltaClient')
    @patch('app.send_email_alert')
    def test_no_alert_when_not_all_losses(self, mock_send_email, mock_client_cls):
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        
        # 2 losses and 1 win
        mock_client.get_closed_positions.return_value = [
            {"product_id": 27, "realized_pnl": 5.0, "fee": 0.1, "closed_at": "2026-06-13 12:00:00 UTC", "side": "buy", "size": 1},
            {"product_id": 27, "realized_pnl": -3.0, "fee": 0.1, "closed_at": "2026-06-13 11:30:00 UTC", "side": "sell", "size": 1},
            {"product_id": 27, "realized_pnl": -2.0, "fee": 0.1, "closed_at": "2026-06-13 11:00:00 UTC", "side": "buy", "size": 1}
        ]
        
        check_and_analyze_consecutive_losses(app, self.account)
        mock_send_email.assert_not_called()

if __name__ == '__main__':
    unittest.main()
