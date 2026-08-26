import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { prompt, language } = await req.json();

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
    const fallbackCode = language === 'pinescript'
      ? `//@version=5
strategy("Synthesized AI Strategy", overlay=true, initial_capital=100000, default_qty_type=strategy.percent_of_equity, default_qty_value=10)

// Parameters
fastLength = input.int(10, "Fast Period", minval=2, maxval=50, step=2)
slowLength = input.int(30, "Slow Period", minval=10, maxval=100, step=5)
rsiLength  = input.int(14, "RSI Length", minval=7, maxval=28, step=1)

// Indicators
fastMA = ta.ema(close, fastLength)
slowMA = ta.ema(close, slowLength)
rsiVal = ta.rsi(close, rsiLength)

// Trading Signals
longCondition = ta.crossover(fastMA, slowMA) and rsiVal > 50
shortCondition = ta.crossunder(fastMA, slowMA) and rsiVal < 50

if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.close("Long")

plot(fastMA, "Fast EMA", color=color.blue)
plot(slowMA, "Slow EMA", color=color.orange)`
      : `import pandas as pd
import numpy as np

def strategy(df: pd.DataFrame, fast_period: int = 12, slow_period: int = 26, rsi_period: int = 14):
    """
    Synthesized Quantitative Trend-Following Strategy
    """
    # Moving Averages
    df['fast_ema'] = df['close'].ewm(span=fast_period, adjust=False).mean()
    df['slow_ema'] = df['close'].ewm(span=slow_period, adjust=False).mean()
    
    # RSI Momentum Filter
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=rsi_period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=rsi_period).mean()
    rs = gain / (loss + 1e-9)
    df['rsi'] = 100 - (100 / (1 + rs))
    
    # Entry & Exit Signals
    df['signal'] = 0
    df.loc[(df['fast_ema'] > df['slow_ema']) & (df['rsi'] > 52), 'signal'] = 1
    df.loc[(df['fast_ema'] < df['slow_ema']), 'signal'] = 0
    
    return df`

    return new Response(fallbackCode, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  }

  try {
    const result = streamText({
      model: openai('gpt-4o'),
      system: `You are an expert algorithmic trading developer. 
You write precise, robust, and clean ${language === 'pine' ? 'Pine Script (v5)' : 'Python'} code for trading strategies.
Output ONLY the raw code. Do not include markdown formatting like \`\`\`python or \`\`\`pine. 
No explanations, no pleasantries, just the raw code that can be executed or backtested directly.`,
      prompt: prompt,
    });

    return result.toTextStreamResponse();
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
