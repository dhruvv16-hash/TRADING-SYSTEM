const code = 
class UTBotStrategy(Strategy):
    sensitivity = 3 # UT Bot Sensitivity (Key Value)
    atr_period = 10 # UT Bot ATR Period
    use_heikin = False # Signals from Heikin Ashi Candles
    use_linreg = True # Lin Reg
    linreg_len = 11 # Linear Regression Length
    use_ema_filter = True # Enable 200 EMA Filter?
    ema_len = 200 # EMA Length
    use_adx_filter = True # Enable ADX Chop Filter?
    adx_min = 20 # ADX Minimum Strength (Usually 20-25)
    adx_smooth = 14 # ADX Smoothing
    trailing_stop = True # Enable ATR Trailing Stop?
    exit_atr_period = 14 # Exit ATR Period
    trail_multiplier = 2.5 # Trailing ATR Multiplier
    take_profit = True # Take Partial Profits (TP1)?
    tp1_dist = 1.5 # TP1 Distance (%)
    tp1_qty = 50 # TP1 Quantity to Sell (%)

    def init(self):
        pass
;

const pyRegex = /^[ \t]+([a-zA-Z0-9_]+)\s*=\s*([0-9\.]+|True|False)\s*(?:#\s*(.*))?$/gm
let match
while ((match = pyRegex.exec(code)) !== null) {
    console.log(match[1], match[2], match[3]);
}

