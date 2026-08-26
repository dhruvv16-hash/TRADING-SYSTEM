import os
import math
import datetime
import logging
import pandas as pd
import numpy as np
from delta_client import DeltaClient

logger = logging.getLogger("loss_analyzer")

def analyze_trade_market_conditions(symbol, entry_px, exit_px, side, closed_at_str):
    """
    Fetches historical candles around the trade closed_at time to analyze trend and volatility.
    """
    from app import public_delta_client
    analysis_details = []
    try:
        import time
        to_time = int(time.time())
        if closed_at_str:
            try:
                clean_ts = closed_at_str.replace("UTC", "").strip()
                if "T" in clean_ts:
                    if clean_ts.endswith('Z'):
                        clean_ts = clean_ts[:-1]
                    dt = datetime.datetime.fromisoformat(clean_ts)
                else:
                    dt = datetime.datetime.strptime(clean_ts, "%Y-%m-%d %H:%M:%S")
                dt = dt.replace(tzinfo=datetime.timezone.utc)
                to_time = int(dt.timestamp())
            except Exception as parse_err:
                logger.error(f"Error parsing closed_at_str: {parse_err}")
                
        # Remove any .P suffix for chart history symbol querying
        exchange_symbol = symbol.replace('.P', '')
        from_time = to_time - 100000  # ~27 hours before the exit
        query_str = f"symbol={exchange_symbol}&resolution=5&from={from_time}&to={to_time}"
        response = public_delta_client._request("GET", "/v2/chart/history", query_string=query_str, is_private=False)
        if not response.get("success"):
            return f"• Failed to fetch market chart history: {response.get('error')}"
            
        result = response.get("result", {})
        closes = np.array([float(x) for x in result.get("c", [])])
        highs = np.array([float(x) for x in result.get("h", [])])
        lows = np.array([float(x) for x in result.get("l", [])])
        if len(closes) < 20:
            return "• Insufficient candle data to analyze market indicators."
        
        # 1. Simple 14-period ATR
        tr_list = []
        for i in range(1, len(closes)):
            tr = max(highs[i] - lows[i], abs(highs[i] - closes[i-1]), abs(lows[i] - closes[i-1]))
            tr_list.append(tr)
        atr_14 = sum(tr_list[-14:]) / 14.0 if tr_list else 0.0
        
        # 2. 20 SMA Trend Filter
        sma_20 = sum(closes[-20:]) / 20.0 if len(closes) >= 20 else closes[-1]
        
        # 3. Choppiness (Standard deviation percentage)
        mean_20 = sum(closes[-20:]) / 20.0
        variance = sum((x - mean_20) ** 2 for x in closes[-20:]) / 20.0
        std_20 = math.sqrt(variance)
        volatility_pct = (std_20 / mean_20) * 100.0 if mean_20 > 0 else 0.0
        
        if volatility_pct < 0.25:
            analysis_details.append("📉 <strong>Market Regime: Choppy / Ranging</strong>. Price standard deviation is extremely low (less than 0.25% of price). In ranging markets, trend-following indicators like Chandelier Exit generate consecutive false breakouts, leading to quick whipsaw stopouts.")
        else:
            analysis_details.append("📈 <strong>Market Regime: Trending / Volatile</strong>. Volatility percent is normal or high, suggesting active directional moves.")

        is_long = (side.upper() == "LONG")
        is_above_sma = (closes[-1] > sma_20)
        if is_long and not is_above_sma:
            analysis_details.append("⚠️ <strong>Trend Mismatch:</strong> Trade entered LONG but price is currently trading below the 20 SMA, indicating a bearish trend alignment at exit.")
        elif not is_long and is_above_sma:
            analysis_details.append("⚠️ <strong>Trend Mismatch:</strong> Trade entered SHORT but price is currently trading above the 20 SMA, indicating a bullish trend alignment at exit.")
            
        price_diff = abs(entry_px - exit_px)
        if atr_14 > 0 and price_diff > 1.5 * atr_14:
            analysis_details.append("⚡ <strong>Volatile Exit:</strong> The exit price difference is greater than 1.5x ATR, indicating a sharp momentum spike stopped the trade out.")
        else:
            analysis_details.append("🔍 <strong>Tight Whipsaw:</strong> The exit price was close to the entry price (less than 1.5x ATR), indicating the stop-loss might be set too tight for market noise.")
            
    except Exception as e:
        analysis_details.append(f"Market analysis temporarily unavailable due to: {str(e)}")
        
    return "<br>".join(analysis_details)

def generate_loss_analysis_report(account, latest_3):
    """
    Generates a beautifully formatted HTML report summarizing consecutive loss details and trade analysis.
    """
    trades_html = ""
    for idx, t in enumerate(latest_3):
        net_pnl_style = "color: #dc2626; font-weight: bold;"
        trades_html += f"""
        <div class="trade-card" style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-left: 4px solid #ef4444; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <div class="trade-title" style="font-weight: 700; font-size: 14px; margin-bottom: 5px;">Trade #{idx+1}: {t['symbol']} ({t['side']})</div>
            <div class="trade-details" style="font-size: 13px; color: #4b5563; line-height: 1.5;">
                <strong>Closed Time:</strong> {t['closed_at']}<br>
                <strong>Size:</strong> {t['closed_size']} contracts<br>
                <strong>Entry Price:</strong> ${t['entry_price']:.2f} &nbsp;|&nbsp; <strong>Exit Price:</strong> ${t['exit_price']:.2f}<br>
                <strong>Gross PnL:</strong> {t['realized_pnl']:+.4f} USD<br>
                <strong>Fees & Commissions:</strong> -${t['fees']:.4f} USD<br>
                <strong>Net PnL:</strong> <span style="{net_pnl_style}">{t['net_pnl']:+.4f} USD</span>
            </div>
        </div>
        """

    analysis_html = ""
    for idx, t in enumerate(latest_3):
        market_cond = analyze_trade_market_conditions(t['symbol'], t['entry_price'], t['exit_price'], t['side'], t['closed_at'])
        analysis_html += f"""
        <p style="margin-bottom: 5px; font-size: 14px; font-weight: 600; color: #111827;">Trade #{idx+1} ({t['symbol']}) Market Analysis:</p>
        <div style="background-color: #f9fafb; padding: 12px; border-radius: 6px; margin-bottom: 15px; border: 1px dashed #e5e7eb; font-size: 13px; color: #4b5563; line-height: 1.6;">
            {market_cond}
        </div>
        """

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Consecutive Losses Analysis Report</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 0;">
    <div class="container" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
        <div class="header" style="background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Consecutive Losses Analysis Report</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Account: {account.name}</p>
        </div>
        <div class="content" style="padding: 24px;">
            <span class="badge" style="display: inline-block; background-color: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 15px;">⚠️ ALERT: 3 Consecutive Losses Detected</span>
            
            <p style="font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                The trading bot has detected <strong>3 consecutive net losses</strong> on your account. As requested, we have compiled an automated market analysis to determine what went wrong.
            </p>
            
            {trades_html}
            
            <div class="analysis-section" style="margin-top: 25px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <div class="analysis-title" style="font-size: 16px; font-weight: 700; margin-bottom: 10px; color: #111827;">🔍 Market & Trend Analysis</div>
                <div class="analysis-text" style="font-size: 13px; line-height: 1.6; color: #374151;">
                    {analysis_html}
                </div>
            </div>
            
            <div class="analysis-section" style="margin-top: 25px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <div class="analysis-title" style="font-size: 16px; font-weight: 700; margin-bottom: 10px; color: #111827;">🛡️ Recommended Mitigations</div>
                <ul class="actions-list" style="margin-top: 10px; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #374151;">
                    <li><strong>Adjust Strategy Parameters:</strong> If false breakouts are common, consider increasing the Chandelier Exit Multiplier (<code>ce_mult</code>) or length in your Global Settings tab.</li>
                    <li><strong>Enable Dry-Run Mode:</strong> You can temporarily toggle <em>Dry-Run Mode</em> on your dashboard's Settings tab to monitor simulated indicator signals without exposing capital.</li>
                    <li><strong>Filter Ranging Markets:</strong> Ensure the ZLSMA filter is active to prevent entries during flat price movements.</li>
                </ul>
            </div>
        </div>
        <div class="footer" style="background-color: #f9fafb; padding: 15px 24px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
            Delta Exchange Webhook Bot • Automated System Alert
        </div>
    </div>
</body>
</html>
"""
    return html

def check_and_analyze_consecutive_losses(app, account):
    """
    Checks if the last 3 closed positions on the account were consecutive losses.
    If so, and if we haven't alerted for the latest loss yet, runs analysis and sends an email report.
    """
    from models import GlobalSetting, db
    
    with app.app_context():
        keys = ["email_enabled", "email_address"]
        settings = GlobalSetting.query.filter(GlobalSetting.key.in_(keys)).all()
        s_dict = {s.key: s.value for s in settings}
        if s_dict.get("email_enabled", "false").lower() != "true":
            logger.info("Consecutive loss analyzer: email alerts are not enabled. Bypassing check.")
            return
            
        email_address = s_dict.get("email_address")
        if not email_address:
            logger.warning("Consecutive loss analyzer: email_address not configured. Bypassing check.")
            return

        last_alert_key = f"last_consecutive_loss_alert_time_{account.id}"
        last_alert_setting = GlobalSetting.query.filter_by(key=last_alert_key).first()
        last_alert_val = last_alert_setting.value if last_alert_setting else ""

    # Call Delta Exchange client to get closed positions (runs outside app context)
    try:
        from app import Config, public_delta_client
        client = DeltaClient(
            api_key=account.api_key,
            api_secret=account.api_secret,
            base_url=Config.BASE_URL
        )
        closed_positions = client.get_closed_positions(limit=10)
    except Exception as e:
        logger.error(f"Loss analyzer: failed to fetch closed positions from Delta: {e}")
        return

    if not closed_positions:
        return

    # Map product info
    try:
        products = public_delta_client.get_products()
        product_map = {p.get("id"): p for p in products if p.get("id")}
    except Exception as e:
        logger.warning(f"Loss analyzer: failed to fetch products for symbol translation: {e}")
        product_map = {}

    parsed_closed = []
    for pos in closed_positions:
        product_id = pos.get("product_id")
        prod_info = product_map.get(product_id) or pos.get("product") or {}
        symbol = prod_info.get("symbol") or f"ID:{product_id}"
        
        # Calculate net PnL (realized PnL - fees)
        rpnl = float(pos.get("realized_pnl") or pos.get("rpnl") or pos.get("pnl") or 0.0)
        
        realized_fee_val = pos.get("fee") or pos.get("realized_fee") or pos.get("commission")
        if realized_fee_val is not None:
            fees = abs(float(realized_fee_val))
        else:
            entry_px = float(pos.get("entry_price") or pos.get("avg_entry_price") or 0)
            exit_px = float(pos.get("close_price") or pos.get("exit_price") or pos.get("avg_exit_price") or 0)
            closed_size = abs(float(pos.get("closed_size") or pos.get("size") or 0.0))
            contract_val_str = prod_info.get("contract_value") or "0.01"
            try:
                contract_value = float(contract_val_str)
            except ValueError:
                contract_value = 0.01
            entry_notional = entry_px * closed_size * contract_value
            exit_notional = exit_px * closed_size * contract_value
            fees = (entry_notional + exit_notional) * 0.0005
            
        net_pnl = rpnl - fees
        closed_at = pos.get("closed_at") or ""
        
        parsed_closed.append({
            "symbol": symbol,
            "side": pos.get("side", "").upper(),
            "closed_size": abs(float(pos.get("closed_size") or pos.get("size") or 0.0)),
            "entry_price": float(pos.get("entry_price") or pos.get("avg_entry_price") or 0),
            "exit_price": float(pos.get("close_price") or pos.get("exit_price") or pos.get("avg_exit_price") or 0),
            "realized_pnl": rpnl,
            "fees": fees,
            "net_pnl": net_pnl,
            "closed_at": closed_at
        })

    # Sort chronological descending (newest first)
    if len(parsed_closed) < 3:
        return

    latest_3 = parsed_closed[:3]
    all_losses = all(t["net_pnl"] < 0 for t in latest_3)
    if not all_losses:
        return

    latest_trade_time = latest_3[0]["closed_at"]
    if latest_trade_time == last_alert_val:
        return

    logger.warning(f"Consecutive loss detected on account '{account.name}'! Latest loss at: {latest_trade_time}. Triggering analysis report...")

    # Run analysis
    analysis_report = generate_loss_analysis_report(account, latest_3)

    # Send email
    from app import send_email_alert
    subject = f"⚠️ [ACTION REQUIRED] Consecutive Losses Analysis Report - Account: {account.name}"
    email_sent = send_email_alert(subject, html_body=analysis_report)
    
    if email_sent:
        logger.info("Consecutive loss analysis email report sent successfully.")
        with app.app_context():
            setting = GlobalSetting.query.filter_by(key=last_alert_key).first()
            if setting:
                setting.value = latest_trade_time
            else:
                setting = GlobalSetting(key=last_alert_key, value=latest_trade_time)
                db.session.add(setting)
            db.session.commit()
    else:
        logger.error("Failed to send consecutive loss analysis email report.")
