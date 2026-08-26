import math
import numpy as np
import pandas as pd

def compute_wma(series, length):
    """Calculates weighted moving average matching TradingView ta.wma."""
    n = len(series)
    if n < length:
        return np.full(n, np.nan)
    
    weights = np.arange(1, length + 1)
    weight_sum = weights.sum()
    
    wma = np.full(n, np.nan)
    for i in range(length - 1, n):
        window = series[i - length + 1 : i + 1]
        if np.any(np.isnan(window)):
            wma[i] = np.nan
        else:
            wma[i] = np.dot(window, weights) / weight_sum
    return wma

def compute_hma(series, length):
    """Calculates Hull Moving Average matching TradingView ta.hma."""
    n = len(series)
    if n < length:
        return np.full(n, np.nan)
        
    half_length = int(math.floor(length / 2))
    sqrt_length = int(math.floor(math.sqrt(length) + 0.5))
    
    wma_half = compute_wma(series, half_length)
    wma_full = compute_wma(series, length)
    
    raw_hma = 2 * wma_half - wma_full
    hma = compute_wma(raw_hma, sqrt_length)
    return hma

def compute_atr(high, low, close, length=14):
    """Calculates Wilder's ATR (RMA of True Range) matching TradingView ta.atr."""
    n = len(close)
    if n < length:
        return np.full(n, np.nan)
        
    tr = np.zeros(n)
    tr[0] = high[0] - low[0]
    for i in range(1, n):
        tr[i] = max(high[i] - low[i], abs(high[i] - close[i-1]), abs(low[i] - close[i-1]))
        
    atr = np.full(n, np.nan)
    # Wilder's RMA initializes with the SMA of the first length bars
    atr[length - 1] = np.mean(tr[:length])
    alpha = 1.0 / length
    for i in range(length, n):
        atr[i] = alpha * tr[i] + (1.0 - alpha) * atr[i-1]
        
    return atr

def compute_chandelier_exit(high, low, close, ce_length=22, ce_mult=3.0, use_close=True):
    """Calculates Chandelier Exit stops and buy/sell signals matching TradingView."""
    n = len(close)
    atr = compute_atr(high, low, close, length=ce_length)
    ce_atr = ce_mult * atr
    
    highest_val = np.zeros(n)
    lowest_val = np.zeros(n)
    
    for i in range(n):
        start = max(0, i - ce_length + 1)
        if use_close:
            highest_val[i] = np.max(close[start:i+1])
            lowest_val[i] = np.min(close[start:i+1])
        else:
            highest_val[i] = np.max(high[start:i+1])
            lowest_val[i] = np.min(low[start:i+1])
            
    long_stop = highest_val - ce_atr
    short_stop = lowest_val + ce_atr
    
    final_long_stop = np.full(n, np.nan)
    final_short_stop = np.full(n, np.nan)
    dir_arr = np.ones(n, dtype=int)
    
    # Initialize the first element where ATR is valid
    start_idx = ce_length - 1
    if start_idx < n:
        final_long_stop[start_idx] = long_stop[start_idx]
        final_short_stop[start_idx] = short_stop[start_idx]
        dir_arr[start_idx] = 1
        
    for i in range(start_idx + 1, n):
        if np.isnan(atr[i]):
            continue
            
        long_stop_prev = final_long_stop[i-1] if not np.isnan(final_long_stop[i-1]) else long_stop[i]
        short_stop_prev = final_short_stop[i-1] if not np.isnan(final_short_stop[i-1]) else short_stop[i]
        
        # Long Stop trailing
        if close[i-1] > long_stop_prev:
            final_long_stop[i] = max(long_stop[i], long_stop_prev)
        else:
            final_long_stop[i] = long_stop[i]
            
        # Short Stop trailing
        if close[i-1] < short_stop_prev:
            final_short_stop[i] = min(short_stop[i], short_stop_prev)
        else:
            final_short_stop[i] = short_stop[i]
            
        # Direction
        if close[i] > short_stop_prev:
            dir_arr[i] = 1
        elif close[i] < long_stop_prev:
            dir_arr[i] = -1
        else:
            dir_arr[i] = dir_arr[i-1]
            
    buy_signals = np.zeros(n, dtype=bool)
    sell_signals = np.zeros(n, dtype=bool)
    for i in range(start_idx + 1, n):
        if np.isnan(atr[i]) or np.isnan(atr[i-1]):
            continue
        buy_signals[i] = (dir_arr[i] == 1) and (dir_arr[i-1] == -1)
        sell_signals[i] = (dir_arr[i] == -1) and (dir_arr[i-1] == 1)
        
    return final_long_stop, final_short_stop, dir_arr, buy_signals, sell_signals

def compute_linreg(series, length, offset=0):
    """Calculates linear regression value matching TradingView ta.linreg."""
    n = len(series)
    if n < length:
        return np.full(n, np.nan)
        
    # Setup fixed linear regression kernel
    x = np.arange(length)
    x_mean = (length - 1) / 2.0
    x_var = np.sum((x - x_mean)**2)
    w = (x - x_mean) / x_var
    kernel = (1.0 / length) + w * ((length - 1) / 2.0 - offset)
    
    result = np.full(n, np.nan)
    vals = np.array(series)
    for idx in range(length - 1, n):
        window = vals[idx - length + 1 : idx + 1]
        if not np.any(np.isnan(window)):
            result[idx] = np.dot(kernel, window)
            
    return result

def compute_zlsma(close, length=32):
    """Calculates ZLSMA matching TradingView."""
    lsma = compute_linreg(close, length, 0)
    lsma2 = compute_linreg(lsma, length, 0)
    zlsma = lsma + (lsma - lsma2)
    return zlsma

def get_pivots(high, low, pivot_len=5):
    """Detects pivot highs and lows matching TradingView ta.pivothigh / ta.pivotlow."""
    n = len(high)
    p_high = [None] * n
    p_low = [None] * n
    
    for idx in range(pivot_len, n - pivot_len):
        val_h = high[idx]
        val_l = low[idx]
        
        # Check pivot high: highest in [idx-pivot_len, idx+pivot_len]
        is_h = True
        for j in range(idx - pivot_len, idx + pivot_len + 1):
            if high[j] > val_h:
                is_h = False
                break
            # Tie breaker: later equal peaks disqualify candidate
            if high[j] == val_h and j > idx:
                is_h = False
                break
                
        # Check pivot low: lowest in [idx-pivot_len, idx+pivot_len]
        is_l = True
        for j in range(idx - pivot_len, idx + pivot_len + 1):
            if low[j] < val_l:
                is_l = False
                break
            # Tie breaker: later equal troughs disqualify candidate
            if low[j] == val_l and j > idx:
                is_l = False
                break
                
        if is_h:
            # Pivot high detected pivot_len bars later
            p_high[idx + pivot_len] = val_h
        if is_l:
            # Pivot low detected pivot_len bars later
            p_low[idx + pivot_len] = val_l
            
    return p_high, p_low

def track_liquidity_pools(high, low, atr, p_high, p_low, cluster_atr=0.15):
    """Tracks BSL and SSL pools statefully, and triggers creation signals."""
    n = len(high)
    bsl_prices = []
    ssl_prices = []
    bsl_created = np.zeros(n, dtype=bool)
    ssl_created = np.zeros(n, dtype=bool)
    
    for i in range(n):
        # 1. Update BSL levels
        p_h = p_high[i]
        if p_h is not None and not np.isnan(atr[i]):
            merged = False
            for p in bsl_prices:
                if abs(p - p_h) <= atr[i] * cluster_atr:
                    merged = True
                    break
            if not merged:
                bsl_prices.append(p_h)
                bsl_created[i] = True
                
        # 2. Update SSL levels
        p_l = p_low[i]
        if p_l is not None and not np.isnan(atr[i]):
            merged = False
            for p in ssl_prices:
                if abs(p - p_l) <= atr[i] * cluster_atr:
                    merged = True
                    break
            if not merged:
                ssl_prices.append(p_l)
                ssl_created[i] = True
                
        # 3. Sweep levels
        bsl_prices = [p for p in bsl_prices if p > high[i]]
        ssl_prices = [p for p in ssl_prices if p < low[i]]
        
    return bsl_created, ssl_created

def compute_ema(series, length):
    """Calculates exponential moving average matching TradingView ta.ema."""
    n = len(series)
    if n < length:
        return np.full(n, np.nan)
        
    ema = np.full(n, np.nan)
    # The first valid value is the SMA of the first length values
    start_slice = series[:length]
    if np.any(np.isnan(start_slice)):
        ema[length - 1] = np.nanmean(start_slice)
    else:
        ema[length - 1] = np.mean(start_slice)
        
    alpha = 2.0 / (length + 1.0)
    for i in range(length, n):
        if not np.isnan(series[i]) and not np.isnan(ema[i-1]):
            ema[i] = series[i] * alpha + ema[i-1] * (1.0 - alpha)
        elif not np.isnan(series[i]):
            ema[i] = series[i]
    return ema

def evaluate_zero_lag_strategy(df, length=70, mult=1.2):
    """
    Computes indicators and triggers signals for the Zero Lag Trend Signals strategy.
    """
    df = df.copy()
    closes = df['close'].values
    highs = df['high'].values
    lows = df['low'].values
    n = len(closes)
    
    lag = int(math.floor((length - 1) / 2 + 0.5))
    
    # src + (src - src[lag])
    # Shift close by lag
    close_series = pd.Series(closes)
    close_lagged = close_series.shift(lag).values
    
    src_zlema = closes + (closes - close_lagged)
    
    # Compute zlema = ta.ema(src_zlema, length)
    zlema = compute_ema(src_zlema, length)
    
    # Compute volatility = ta.highest(ta.atr(length), length*3) * mult
    atr = compute_atr(highs, lows, closes, length=length)
    volatility = pd.Series(atr).rolling(window=length*3, min_periods=1).max().values * mult
    
    trend = np.zeros(n, dtype=int)
    current_trend = 0
    
    for i in range(n):
        if np.isnan(zlema[i]) or np.isnan(volatility[i]):
            trend[i] = 0
            continue
            
        upper_band = zlema[i] + volatility[i]
        lower_band = zlema[i] - volatility[i]
        
        prev_close = closes[i-1] if i > 0 else np.nan
        prev_upper = zlema[i-1] + volatility[i-1] if (i > 0 and not np.isnan(zlema[i-1])) else np.nan
        prev_lower = zlema[i-1] - volatility[i-1] if (i > 0 and not np.isnan(zlema[i-1])) else np.nan
        
        is_crossover = (closes[i] > upper_band) and (prev_close <= prev_upper or np.isnan(prev_close))
        is_crossunder = (closes[i] < lower_band) and (prev_close >= prev_lower or np.isnan(prev_close))
        
        if is_crossover:
            current_trend = 1
        elif is_crossunder:
            current_trend = -1
            
        trend[i] = current_trend
        
    # Generate entry conditions matching crossover/crossunder with 0
    long_condition = np.zeros(n, dtype=bool)
    short_condition = np.zeros(n, dtype=bool)
    
    for i in range(1, n):
        prev_t = trend[i-1]
        curr_t = trend[i]
        
        # crossover(trend, 0) -> trend crossed above 0
        long_condition[i] = (curr_t == 1) and (prev_t <= 0) and (prev_t != 1)
        # crossunder(trend, 0) -> trend crossed below 0
        short_condition[i] = (curr_t == -1) and (prev_t >= 0) and (prev_t != -1)
        
    return {
        "zlsma": zlema, # Map zlema to zlsma so visual plots still work on dashboard
        "long_stop": zlema - volatility, # Map lower band to long stop
        "short_stop": zlema + volatility, # Map upper band to short stop
        "dir": trend,
        "buy_signal": long_condition,
        "sell_signal": short_condition,
        "bsl_created": np.zeros(n, dtype=bool),
        "ssl_created": np.zeros(n, dtype=bool),
        "long_condition": long_condition,
        "short_condition": short_condition
    }

def evaluate_ai_zl_fusion_strategy(df, ai_speed=14, atr_len=14, atr_mult=2.0, zl_len=70, zl_mult=1.2):
    """
    Computes indicators and confluence signals for the AI Zero-Lag Fusion Strategy.
    """
    df = df.copy()
    closes = df['close'].values
    highs = df['high'].values
    lows = df['low'].values
    n = len(closes)
    
    # 1. AI Engine (Micro Trend)
    smooth_src = compute_hma(closes, ai_speed)
    ai_atr_val = compute_atr(highs, lows, closes, length=atr_len) * atr_mult
    
    ai_line = np.zeros(n)
    ai_trend = np.ones(n, dtype=int)
    
    current_ai_line = 0.0
    current_ai_trend = 1
    
    for i in range(n):
        if np.isnan(smooth_src[i]) or np.isnan(ai_atr_val[i]):
            ai_line[i] = np.nan
            ai_trend[i] = 1
            continue
            
        prev_ai_line = current_ai_line
        
        if current_ai_trend == 1:
            cand_val = smooth_src[i] - ai_atr_val[i]
            if prev_ai_line == 0.0 or np.isnan(prev_ai_line):
                current_ai_line = cand_val
            else:
                current_ai_line = max(prev_ai_line, cand_val)
                
            if closes[i] < current_ai_line:
                current_ai_trend = -1
                current_ai_line = smooth_src[i] + ai_atr_val[i]
        else:
            cand_val = smooth_src[i] + ai_atr_val[i]
            if prev_ai_line == 0.0 or np.isnan(prev_ai_line):
                current_ai_line = cand_val
            else:
                current_ai_line = min(prev_ai_line, cand_val)
                
            if closes[i] > current_ai_line:
                current_ai_trend = 1
                current_ai_line = smooth_src[i] - ai_atr_val[i]
                
        ai_line[i] = current_ai_line
        ai_trend[i] = current_ai_trend

    # 2. ZLEMA Engine (Macro Trend)
    lag_val = int(math.floor((zl_len - 1) / 2 + 0.5))
    close_series = pd.Series(closes)
    close_lagged = close_series.shift(lag_val).values
    src_zlema = closes + (closes - close_lagged)
    zlema_vals = compute_ema(src_zlema, zl_len)
    
    atr_zl = compute_atr(highs, lows, closes, length=zl_len)
    volatility_zl = pd.Series(atr_zl).rolling(window=zl_len * 3, min_periods=1).max().values * zl_mult
    
    zl_trend = np.zeros(n, dtype=int)
    current_zl_trend = 0
    
    for i in range(n):
        if np.isnan(zlema_vals[i]) or np.isnan(volatility_zl[i]):
            zl_trend[i] = 0
            continue
            
        upper_band = zlema_vals[i] + volatility_zl[i]
        lower_band = zlema_vals[i] - volatility_zl[i]
        
        prev_close = closes[i-1] if i > 0 else np.nan
        prev_upper = zlema_vals[i-1] + volatility_zl[i-1] if (i > 0 and not np.isnan(zlema_vals[i-1])) else np.nan
        prev_lower = zlema_vals[i-1] - volatility_zl[i-1] if (i > 0 and not np.isnan(zlema_vals[i-1])) else np.nan
        
        is_crossover = (closes[i] > upper_band) and (prev_close <= prev_upper or np.isnan(prev_close))
        is_crossunder = (closes[i] < lower_band) and (prev_close >= prev_lower or np.isnan(prev_close))
        
        if is_crossover:
            current_zl_trend = 1
        elif is_crossunder:
            current_zl_trend = -1
            
        zl_trend[i] = current_zl_trend

    # 3. Market State Chop Filter
    atr_14 = compute_atr(highs, lows, closes, length=14)
    tr = np.zeros(n)
    tr[0] = highs[0] - lows[0]
    for i in range(1, n):
        tr[i] = max(highs[i] - lows[i], abs(highs[i] - closes[i-1]), abs(lows[i] - closes[i-1]))
    sma_tr_50 = pd.Series(tr).rolling(window=50, min_periods=1).mean().values
    
    volatility_ratio = np.zeros(n)
    is_choppy = np.zeros(n, dtype=bool)
    for i in range(n):
        if not np.isnan(atr_14[i]) and not np.isnan(sma_tr_50[i]) and sma_tr_50[i] != 0:
            volatility_ratio[i] = atr_14[i] / sma_tr_50[i]
            is_choppy[i] = volatility_ratio[i] < 0.8
        else:
            is_choppy[i] = True # Default to choppy if not enough warmup

    # 3b. Pullback Re-entry Signals (9 EMA Hook)
    ema_9 = compute_ema(closes, 9)
    long_reentry = np.zeros(n, dtype=bool)
    short_reentry = np.zeros(n, dtype=bool)
    
    for i in range(n):
        if i < 4 or np.isnan(ema_9[i]) or np.isnan(zlema_vals[i]) or np.isnan(volatility_zl[i]):
            continue
            
        # Long Re-entry setup (confluent trend, not choppy, pull back below 9 EMA, close above 9 EMA, above stop loss line)
        if ai_trend[i] == 1 and zl_trend[i] == 1 and not is_choppy[i]:
            if closes[i] > ema_9[i]:
                if any(lows[j] < ema_9[j] for j in range(i-3, i+1)):
                    if closes[i] > zlema_vals[i] - volatility_zl[i]:
                        long_reentry[i] = True
                        
        # Short Re-entry setup (confluent trend, not choppy, pull back above 9 EMA, close below 9 EMA, below stop loss line)
        if ai_trend[i] == -1 and zl_trend[i] == -1 and not is_choppy[i]:
            if closes[i] < ema_9[i]:
                if any(highs[j] > ema_9[j] for j in range(i-3, i+1)):
                    if closes[i] < zlema_vals[i] + volatility_zl[i]:
                        short_reentry[i] = True

    # 4. Master Fusion Logic (Confluence & Cash State)
    # Track simulated position state in calculation loop
    sim_pos = 0 # 0 = flat/cash, 1 = long, -1 = short
    
    buy_signals = np.zeros(n, dtype=bool)
    sell_signals = np.zeros(n, dtype=bool)
    exit_long_signals = np.zeros(n, dtype=bool)
    exit_short_signals = np.zeros(n, dtype=bool)
    master_trend = np.zeros(n, dtype=int)
    
    for i in range(n):
        # 1. Process active position exits first
        if sim_pos == 1:
            # exit_long: AI trend breaks OR market goes choppy
            if (ai_trend[i] == -1) or is_choppy[i]:
                exit_long_signals[i] = True
                sim_pos = 0
        elif sim_pos == -1:
            # exit_short: AI trend breaks OR market goes choppy
            if (ai_trend[i] == 1) or is_choppy[i]:
                exit_short_signals[i] = True
                sim_pos = 0
                
        # 2. Process new entries if flat
        if sim_pos == 0:
            if (ai_trend[i] == 1) and (zl_trend[i] == 1) and not is_choppy[i]:
                buy_signals[i] = True
                sim_pos = 1
            elif (ai_trend[i] == -1) and (zl_trend[i] == -1) and not is_choppy[i]:
                sell_signals[i] = True
                sim_pos = -1
                
        master_trend[i] = sim_pos
        
    return {
        "zlsma": zlema_vals,  # Map zlema to zlsma so visual plots still work on dashboard
        "long_stop": zlema_vals - volatility_zl,  # Map lower band to long stop
        "short_stop": zlema_vals + volatility_zl,  # Map upper band to short stop
        "dir": master_trend,
        "buy_signal": buy_signals,
        "sell_signal": sell_signals,
        "exit_long": exit_long_signals,
        "exit_short": exit_short_signals,
        "bsl_created": np.zeros(n, dtype=bool),
        "ssl_created": np.zeros(n, dtype=bool),
        "long_condition": buy_signals,
        "short_condition": sell_signals,
        "long_reentry": long_reentry,
        "short_reentry": short_reentry,
        "ai_trend": ai_trend,
        "zl_trend": zl_trend,
        "is_choppy": is_choppy
    }

def evaluate_strategy(df, strategy_type="chandelier_exit", ce_length=22, ce_mult=3.0, zlsma_length=32, vol_length=20, vol_mult=1.15, zl_length=70, zl_mult=1.2, ai_speed=14, ai_atr_len=14, ai_atr_mult=2.0):
    """
    Computes all indicators and triggers signals on a DataFrame of candlesticks.
    Required columns: ['open', 'high', 'low', 'close', 'volume', 'time']
    Dispatches to the correct calculation logic based on strategy_type.
    """
    if str(strategy_type).lower() == "zero_lag":
        return evaluate_zero_lag_strategy(df, length=zl_length, mult=zl_mult)
    elif str(strategy_type).lower() == "ai_zl_fusion":
        return evaluate_ai_zl_fusion_strategy(df, ai_speed=int(ai_speed), atr_len=int(ai_atr_len), atr_mult=float(ai_atr_mult), zl_len=int(zl_length), zl_mult=float(zl_mult))
        
    # Fallback to Chandelier Exit + ZLSMA
    df = df.copy()
    closes = df['close'].values
    highs = df['high'].values
    lows = df['low'].values
    volumes = df['volume'].values
    
    # 1. Chandelier Exit
    long_stop, short_stop, dir_arr, buy_sig, sell_sig = compute_chandelier_exit(
        highs, lows, closes, ce_length=int(ce_length), ce_mult=float(ce_mult), use_close=True
    )
    
    # 2. ZLSMA
    zlsma = compute_zlsma(closes, length=int(zlsma_length))
    
    # 3. Liquidity Pools
    liq_atr = compute_atr(highs, lows, closes, length=14)
    p_high, p_low = get_pivots(highs, lows, pivot_len=5)
    bsl_created, ssl_created = track_liquidity_pools(highs, lows, liq_atr, p_high, p_low, cluster_atr=0.15)
    
    # 4. Confirmation Filters
    # ZLSMA Slope
    zlsma_rising = np.zeros(len(closes), dtype=bool)
    zlsma_falling = np.zeros(len(closes), dtype=bool)
    for i in range(1, len(closes)):
        if not np.isnan(zlsma[i]) and not np.isnan(zlsma[i-1]):
            zlsma_rising[i] = zlsma[i] > zlsma[i-1]
            zlsma_falling[i] = zlsma[i] < zlsma[i-1]
            
    # Volume Filter
    vol_sma = pd.Series(volumes).rolling(window=int(vol_length)).mean().values
    rel_vol_ok = np.zeros(len(closes), dtype=bool)
    for i in range(len(closes)):
        if not np.isnan(vol_sma[i]):
            rel_vol_ok[i] = volumes[i] > (vol_sma[i] * float(vol_mult))
        else:
            rel_vol_ok[i] = False
            
    # Trend conditions
    long_trend_ok = np.zeros(len(closes), dtype=bool)
    short_trend_ok = np.zeros(len(closes), dtype=bool)
    for i in range(len(closes)):
        if not np.isnan(zlsma[i]):
            long_trend_ok[i] = (closes[i] > zlsma[i]) and zlsma_rising[i]
            short_trend_ok[i] = (closes[i] < zlsma[i]) and zlsma_falling[i]
            
    # Entry conditions (Volume POC filter ignored as per requirements)
    long_condition = np.zeros(len(closes), dtype=bool)
    short_condition = np.zeros(len(closes), dtype=bool)
    for i in range(len(closes)):
        long_condition[i] = buy_sig[i] and long_trend_ok[i] and rel_vol_ok[i]
        short_condition[i] = sell_sig[i] and short_trend_ok[i] and rel_vol_ok[i]
        
    return {
        "long_stop": long_stop,
        "short_stop": short_stop,
        "dir": dir_arr,
        "buy_signal": buy_sig,
        "sell_signal": sell_sig,
        "zlsma": zlsma,
        "bsl_created": bsl_created,
        "ssl_created": ssl_created,
        "long_condition": long_condition,
        "short_condition": short_condition
    }
