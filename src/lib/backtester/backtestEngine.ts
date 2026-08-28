// src/lib/backtester/backtestEngine.ts
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export interface BacktestEngineResult {
  status: string
  metrics: {
    totalReturn: number
    maxDrawdown: number
    profitFactor: number
    totalTrades: number
    winRate: number
    sharpeRatio: number
    startEquity: number
    endEquity: number
  }
  equityCurve: Array<{ date: string; equity: number }>
  tradesCount: number
  recentTrades: Array<{
    entryDate: string
    exitDate: string
    pnl: number
    returnPct: number
  }>
}

export interface OptimizationEngineResult {
  status: string
  bestParams: Record<string, any>
  topCombinations: Array<{
    params: Record<string, any>
    totalReturn: number
    maxDrawdown: number
    profitFactor: number
    sharpeRatio: number
    score: number
  }>
  totalEvaluated: number
}

export interface RobustnessEngineResult {
  status: string
  survivalRate: number
  simulatedDrawdown: number
  baselineDrawdown: number
  confidenceScore: number
  samplePaths: number[][]
}

export async function runPythonBacktester(
  mode: 'backtest' | 'optimize' | 'walk_forward' | 'cross_validation' | 'robustness',
  options: {
    code?: string
    params?: Record<string, any>
    paramGrid?: Record<string, any[]>
    asset?: string
  }
): Promise<any> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), 'src', 'lib', 'backtester', 'engine_bridge.py')
    const dataDir = path.join(process.cwd(), '..', 'BACKTESTING', 'unified_backtester', 'data')

    const args = [
      scriptPath,
      '--mode', mode,
      '--asset', options.asset || 'STOCK',
      '--data_dir', dataDir,
      '--params', JSON.stringify(options.params || {}),
      '--param_grid', JSON.stringify(options.paramGrid || {}),
    ]

    // Pass code via temporary file to avoid command line length limits
    let tmpFile = ''
    if (options.code) {
      tmpFile = path.join(process.cwd(), '.next', `temp_strat_${Date.now()}_${Math.random().toString(36).slice(2)}.py`)
      try {
        fs.mkdirSync(path.dirname(tmpFile), { recursive: true })
        fs.writeFileSync(tmpFile, options.code, 'utf-8')
        args.push('--code_file', tmpFile)
      } catch (e) {
        args.push('--code', options.code)
      }
    }

    const pyProcess = spawn('python', args)
    let stdoutData = ''
    let stderrData = ''

    pyProcess.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString()
    })

    pyProcess.stderr.on('data', (chunk) => {
      stderrData += chunk.toString()
    })

    pyProcess.on('close', (code) => {
      if (tmpFile && fs.existsSync(tmpFile)) {
        try { fs.unlinkSync(tmpFile) } catch (_) {}
      }

      if (code === 0 && stdoutData.trim()) {
        try {
          // Find the JSON substring in case of stdout noise
          const jsonStart = stdoutData.indexOf('{')
          const jsonEnd = stdoutData.lastIndexOf('}')
          if (jsonStart !== -1 && jsonEnd !== -1) {
            const parsed = JSON.parse(stdoutData.slice(jsonStart, jsonEnd + 1))
            return resolve(parsed)
          }
        } catch (err) {
          console.error("Failed to parse Python backtester JSON:", err)
        }
      }

      // Surface a real error — never silently fake financial results
      const errDetail = stderrData?.trim() || `Process exited with code ${code}`
      throw new Error(`Backtesting engine failed: ${errDetail}`)
    })
  })
}
