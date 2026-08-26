'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

export async function discoverParameters(strategyId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } })
  if (!strategy || strategy.userId !== userId) throw new Error("Not found")

  // Local Lightweight AST/Regex Parser (Fallback when no AI key)
  if (!process.env.OPENAI_API_KEY) {
    const params = extractParametersLocally(strategy.code, strategy.language)
    if (params.length === 0) {
      // Ultimate fallback if parser finds nothing
      params.push({ name: 'period', description: 'Main period length', type: 'int', defaultVal: '14' })
    }
    await saveDiscoveredParams(strategyId, params)
    return
  }

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: z.object({
        parameters: z.array(z.object({
          name: z.string().describe("The exact variable name in the code"),
          description: z.string().describe("What the parameter controls"),
          type: z.enum(['int', 'float', 'bool']),
          defaultVal: z.string().describe("The default value found in the code, as a string")
        }))
      }),
      prompt: `Analyze the following trading strategy code and identify the tunable parameters (e.g., lookback windows, multipliers, thresholds). Return a list of them.\n\nCode:\n${strategy.code}`
    })

    await saveDiscoveredParams(strategyId, object.parameters)
  } catch (e: any) {
    throw new Error(`Failed to discover parameters: ${e.message}`)
  }
}

async function saveDiscoveredParams(strategyId: string, params: any[]) {
  // Clear existing to avoid duplicates on re-discovery
  await prisma.parameter.deleteMany({ where: { strategyId } })
  
  for (const p of params) {
    await prisma.parameter.create({
      data: {
        strategyId,
        name: p.name,
        description: p.description,
        type: p.type,
        defaultVal: p.defaultVal,
      }
    })
  }

  // Update phase if needed
  await prisma.strategy.update({
    where: { id: strategyId },
    data: { phase: 'parameters' }
  })

  revalidatePath(`/strategies/${strategyId}/parameters`)
}

export async function saveParameterConfig(formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const strategyId = formData.get('strategyId') as string
  const paramIds = formData.getAll('paramId') as string[]

  for (const id of paramIds) {
    await prisma.parameter.update({
      where: { id },
      data: {
        minVal: formData.get(`min_${id}`) as string,
        maxVal: formData.get(`max_${id}`) as string,
        step: formData.get(`step_${id}`) as string,
      }
    })
  }

  // Update phase
  await prisma.strategy.update({
    where: { id: strategyId },
    data: { phase: 'data' }
  })

  revalidatePath(`/strategies/${strategyId}`)
  redirect(`/strategies/${strategyId}`)
}

function extractParametersLocally(code: string, language: string) {
  const params: any[] = []
  
  // Try Pine Script parser if it looks like Pine Script (contains 'input' or 'strategy')
  // even if the language flag is incorrectly set to python
  if (code.includes('input(') || code.includes('input.') || language === 'pine' || language === 'pinescript') {
    const lines = code.split('\n')
    for (const line of lines) {
      if (line.includes('input(') || line.includes('input.')) {
        // Match: var_name = input(...)
        const assignmentMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*=(.*input.*)/)
        if (assignmentMatch) {
          const varName = assignmentMatch[1]
          const rest = assignmentMatch[2]
          
          // Extract title
          const titleMatch = rest.match(/title\s*=\s*['"]([^'"]+)['"]/)
          const title = titleMatch ? titleMatch[1] : varName
          
          // Extract defval
          let defval = '1'
          const defvalMatch = rest.match(/defval\s*=\s*([0-9\.]+|true|false)/i)
          if (defvalMatch) {
            defval = defvalMatch[1]
          } else {
             // Look for first arg if not named
             const firstArgMatch = rest.match(/input(?:\.(?:int|float|bool))?\s*\(\s*([0-9\.]+|true|false)/i)
             if (firstArgMatch) {
               defval = firstArgMatch[1]
             }
          }
          
          // Infer type
          let type = 'int'
          if (defval.toLowerCase() === 'true' || defval.toLowerCase() === 'false') type = 'bool'
          else if (defval.includes('.') || rest.includes('input.float') || rest.includes('type=input.float')) type = 'float'
          
          params.push({
            name: varName,
            description: title,
            type,
            defaultVal: defval
          })
        }
      }
    }
  } 
  
  // Try Python parser if it looks like Python (or if Pine parser found nothing)
  if (params.length === 0 || language === 'python') {
    const pyRegex = /^[ \t]+([a-zA-Z0-9_]+)\s*=\s*([0-9\.]+|True|False)\s*(?:#\s*(.*))?$/gm
    let match
    while ((match = pyRegex.exec(code)) !== null) {
      const name = match[1]
      const val = match[2]
      const comment = match[3]
      
      // Skip common non-parameters
      if (['index', 'df', 'data', 'self'].includes(name)) continue;

      let type = 'int'
      if (val === 'True' || val === 'False') type = 'bool'
      else if (val.includes('.')) type = 'float'

      // Only push if not already found (in case of overlap)
      if (!params.find(p => p.name === name)) {
        params.push({
          name,
          description: comment || name.replace(/_/g, ' '),
          type,
          defaultVal: val
        })
      }
    }
  }
  
  return params
}

