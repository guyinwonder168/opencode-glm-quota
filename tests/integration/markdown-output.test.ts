import { describe, test } from 'node:test'
import * as assert from 'node:assert'
import { EventEmitter } from 'node:events'
import type { RequestOptions } from 'node:https'
import { createRequire, syncBuiltinESMExports } from 'node:module'
import { GlmQuotaPlugin } from '../../src/index.js'

const require = createRequire(import.meta.url)
const https = require('node:https') as typeof import('node:https')
const fs = require('node:fs') as typeof import('node:fs')

type PluginContext = Parameters<typeof GlmQuotaPlugin>[0]
type ToolExecutor = {
  execute: (args?: Record<string, unknown>, context?: Record<string, unknown>) => Promise<string> | string
}

type MockResponse = {
  statusCode: number
  body: Record<string, unknown>
}

type MockRequest = EventEmitter & {
  destroy: () => void
  end: () => void
  setTimeout: (_timeout: number) => MockRequest
}

function createMockRequest(responses: Record<string, MockResponse>) {
  return (
    options: RequestOptions,
    callback: (response: EventEmitter & { statusCode?: number }) => void
  ): MockRequest => {
    const request = new EventEmitter() as MockRequest
    const path = options.path ?? ''
    const matchedKey = Object.keys(responses).find((key) => path.includes(key))
    const mockResponse = matchedKey ? responses[matchedKey] : { statusCode: 404, body: { error: 'not found' } }

    request.destroy = () => {}
    request.setTimeout = () => request
    request.end = () => {
      queueMicrotask(() => {
        const response = new EventEmitter() as EventEmitter & { statusCode?: number }
        response.statusCode = mockResponse.statusCode
        callback(response)

        queueMicrotask(() => {
          response.emit('data', JSON.stringify(mockResponse.body))
          response.emit('end')
        })
      })
    }

    return request
  }
}

describe('Integration: Markdown Output', () => {
  test('renders full usage report as Markdown tables', async () => {
    process.env.ZAI_API_KEY = 'test-token'

    const originalRequest = https.request
    https.request = createMockRequest({
        '/quota/limit': {
          statusCode: 200,
          body: {
            data: {
              level: 'pro',
              limits: [
                {
                  type: 'TOKENS_LIMIT',
                  unit: 3,
                  number: 5,
                  percentage: 40.5,
                  nextResetTime: Date.now() + (3 * 60 * 60 * 1000) + (42 * 60 * 1000)
                },
                {
                  type: 'TOKENS_LIMIT',
                  unit: 6,
                  number: 1,
                  percentage: 52.0,
                  nextResetTime: Date.now() + (4 * 24 * 60 * 60 * 1000) + (12 * 60 * 60 * 1000)
                },
                {
                  type: 'TIME_LIMIT',
                  percentage: 12.3,
                  currentValue: 123,
                  usage: 1000,
                  usageDetails: [
                    { modelCode: 'search-prime', usage: 5678 },
                    { modelCode: 'web-reader', usage: 2345 },
                    { modelCode: 'zread', usage: 890 }
                  ]
                }
              ]
            }
          }
        },
        '/model-usage': {
          statusCode: 200,
          body: {
            data: {
              totalUsage: {
                totalModelCallCount: 1234,
                totalTokensUsage: 12500000
              }
            }
          }
        },
        '/tool-usage': {
          statusCode: 200,
          body: {
            data: {
              totalUsage: {
                totalNetworkSearchCount: 5678,
                totalWebReadMcpCount: 2345,
                totalZreadMcpCount: 890
              }
            }
          }
        }
      }) as typeof https.request
    syncBuiltinESMExports()

    try {
      const plugin = await GlmQuotaPlugin({} as unknown as PluginContext)
      const result = await (plugin.tool!.glm_quota as unknown as ToolExecutor).execute()

      assert.ok(result.includes('### 📊 Z.ai GLM Coding Plan — Pro'))
      assert.ok(result.includes('- **Platform**: Z.AI'))
      assert.ok(result.includes('- **Period**: '))
      assert.ok(result.includes('##### 🪙 Quota Limits'))
      assert.ok(result.includes('| Window | Usage | Progress | Resets In |'))
      assert.ok(result.includes('| ⏱️ 5h Token | 40.5% | `█████░░░░░░░` |'))
      assert.ok(result.includes('| 📅 Weekly | 52.0% | `██████░░░░░░` |'))
      assert.ok(result.includes('| 🔌 MCP (1 Month) | 12.3% | `█░░░░░░░░░░░` | — |'))
      assert.ok(result.includes('##### 📊 Quota Usage'))
      assert.ok(result.includes('| 💰 **Token Used** | **12,500,000 / 40,000,000** |'))
      assert.ok(result.includes('| 🔌 **MCP Used** | **123 / 1000** |'))
      assert.ok(result.includes('##### 🔧 MCP Tool Breakdown'))
      assert.ok(result.includes('| 🔍 Network Searches | 5,678 |'))
      assert.ok(result.includes('| 🌐 Web Reads | 2,345 |'))
      assert.ok(result.includes('| 📖 ZRead Calls | 890 |'))
      assert.ok(result.includes('##### 🤖 Model Usage (24h)'))
      assert.ok(result.includes('| 🔢 Total Tokens | 12,500,000 (31% of 5h limit) |'))
      assert.ok(result.includes('| ⏱️ 5h Window | 40.5% of 40,000,000 |'))
      assert.ok(result.includes('| 📞 Total Calls | 1,234 |'))
      assert.ok(result.includes('##### 🛠️ Tool Usage (24h)'))
      assert.ok(result.includes('| 🎭 ZRead Calls | 890 |'))
      assert.ok(!result.includes('╔'), 'Markdown output should not contain ASCII box borders')
    } finally {
      https.request = originalRequest
      syncBuiltinESMExports()
      delete process.env.ZAI_API_KEY
    }
  })

  test('returns credential errors as Markdown', async () => {
    const originalExistsSync = fs.existsSync

    fs.existsSync = (() => false) as typeof fs.existsSync
    syncBuiltinESMExports()
    delete process.env.ZAI_API_KEY
    delete process.env.ZHIPU_API_KEY
    delete process.env.ZHIPUAI_API_KEY

    try {
      const plugin = await GlmQuotaPlugin({} as unknown as PluginContext)
      const result = await (plugin.tool!.glm_quota as unknown as ToolExecutor).execute()

      assert.ok(result.startsWith('### ⚠️ '), 'Credential error should start with a Markdown title')
      assert.ok(result.includes('Please authenticate first'))
      assert.ok(result.includes('Run `/connect` command in OpenCode TUI'))
      assert.ok(!result.includes('╚'), 'Credential error should not contain box borders')
    } finally {
      fs.existsSync = originalExistsSync
      syncBuiltinESMExports()
    }
  })
})
