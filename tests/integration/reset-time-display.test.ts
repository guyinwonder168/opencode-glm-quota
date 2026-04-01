import { afterEach, beforeEach, describe, test } from 'node:test'
import assert from 'node:assert'
import { EventEmitter } from 'node:events'
import type { RequestOptions } from 'node:https'
import { createRequire, syncBuiltinESMExports } from 'node:module'
import { GlmQuotaPlugin } from '../../src/index.js'

const require = createRequire(import.meta.url)
const https = require('node:https') as typeof import('node:https')

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
    const requestPath = options.path ?? ''
    const matchedKey = Object.keys(responses).find((key) => requestPath.includes(key))
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

describe('Reset Time Display Integration', () => {
  const fixedNow = 1737763200000
  const originalNow = Date.now
  const originalRequest = https.request

  beforeEach(() => {
    Date.now = () => fixedNow
    process.env.ZAI_API_KEY = 'test-token'
  })

  afterEach(() => {
    Date.now = originalNow
    https.request = originalRequest
    syncBuiltinESMExports()
    delete process.env.ZAI_API_KEY
  })

  test('renders short reset windows as h and m in the Markdown quota table', async () => {
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
                percentage: 45,
                nextResetTime: fixedNow + (4 * 60 * 60 * 1000) + (42 * 60 * 1000)
              }
            ]
          }
        }
      },
      '/model-usage': {
        statusCode: 200,
        body: { data: { totalUsage: { totalModelCallCount: 12, totalTokensUsage: 1000 } } }
      },
      '/tool-usage': {
        statusCode: 200,
        body: { data: { totalUsage: { totalNetworkSearchCount: 1, totalWebReadMcpCount: 2, totalZreadMcpCount: 3 } } }
      }
    }) as typeof https.request
    syncBuiltinESMExports()

    const plugin = await GlmQuotaPlugin({} as unknown as PluginContext)
    const result = await (plugin.tool!.glm_quota as unknown as ToolExecutor).execute()

    assert.ok(result.includes('| ⏱️ 5h Token | 45.0% | `█████░░░░░░░` | 4h 42m |'))
  })

  test('renders long reset windows as days and hours in the Markdown quota table', async () => {
    https.request = createMockRequest({
      '/quota/limit': {
        statusCode: 200,
        body: {
          data: {
            level: 'pro',
            limits: [
              {
                type: 'TOKENS_LIMIT',
                unit: 6,
                number: 1,
                percentage: 52,
                nextResetTime: fixedNow + (4 * 24 * 60 * 60 * 1000) + (12 * 60 * 60 * 1000)
              }
            ]
          }
        }
      },
      '/model-usage': {
        statusCode: 200,
        body: { data: { totalUsage: { totalModelCallCount: 12, totalTokensUsage: 1000 } } }
      },
      '/tool-usage': {
        statusCode: 200,
        body: { data: { totalUsage: { totalNetworkSearchCount: 1, totalWebReadMcpCount: 2, totalZreadMcpCount: 3 } } }
      }
    }) as typeof https.request
    syncBuiltinESMExports()

    const plugin = await GlmQuotaPlugin({} as unknown as PluginContext)
    const result = await (plugin.tool!.glm_quota as unknown as ToolExecutor).execute()

    assert.ok(result.includes('| 📅 Weekly | 52.0% | `██████░░░░░░` | 4d 12h |'))
  })

  test('renders MCP rows without a reset countdown in the Markdown quota table', async () => {
    https.request = createMockRequest({
      '/quota/limit': {
        statusCode: 200,
        body: {
          data: {
            level: 'pro',
            limits: [
              {
                type: 'TIME_LIMIT',
                percentage: 12.3,
                currentValue: 123,
                usage: 1000,
                usageDetails: [
                  { modelCode: 'search-prime', usage: 1 },
                  { modelCode: 'web-reader', usage: 2 },
                  { modelCode: 'zread', usage: 3 }
                ]
              }
            ]
          }
        }
      },
      '/model-usage': {
        statusCode: 200,
        body: { data: { totalUsage: { totalModelCallCount: 12, totalTokensUsage: 1000 } } }
      },
      '/tool-usage': {
        statusCode: 200,
        body: { data: { totalUsage: { totalNetworkSearchCount: 1, totalWebReadMcpCount: 2, totalZreadMcpCount: 3 } } }
      }
    }) as typeof https.request
    syncBuiltinESMExports()

    const plugin = await GlmQuotaPlugin({} as unknown as PluginContext)
    const result = await (plugin.tool!.glm_quota as unknown as ToolExecutor).execute()

    assert.ok(result.includes('| 🔌 MCP (1 Month) | 12.3% | `█░░░░░░░░░░░` | — |'))
  })
})
