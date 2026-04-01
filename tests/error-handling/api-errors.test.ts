/**
 * API Error Handling Tests (v1.7.0 Markdown format)
 * Tests for HTTP 429 rate limiting and 500+ server errors
 */

import { describe, it } from 'node:test'
import * as assert from 'node:assert'
import { formatApiError } from '../../src/api/client.js'

describe('formatApiError - 429 Rate Limit', () => {
  it('formats 429 with Markdown header', () => {
    const err = formatApiError(429, 'Too Many Requests', 'tok')
    assert.ok(err.message.includes('### ⚠️ Rate Limited'))
  })

  it('includes status metadata', () => {
    const err = formatApiError(429, 'Too Many Requests', 'tok')
    assert.ok(err.message.includes('- **Status**: 429'))
  })

  it('includes fix steps', () => {
    const err = formatApiError(429, 'Too Many Requests', 'tok')
    assert.ok(err.message.includes('**How to fix:**'))
  })

  it('sanitizes token from response', () => {
    const secret = 'sk-rate-secret'
    const err = formatApiError(429, `Rate exceeded for ${secret}`, secret)
    assert.ok(!err.message.includes(secret))
    assert.ok(err.message.includes('***'))
  })

  it('includes details when non-default body', () => {
    const err = formatApiError(429, 'Custom rate limit msg', 'tok')
    assert.ok(err.message.includes('Custom rate limit msg'))
  })
})

describe('formatApiError - 500+ Server Errors', () => {
  it('formats 500 with Markdown header', () => {
    const err = formatApiError(500, 'Internal Server Error', 'tok')
    assert.ok(err.message.includes('### ⚠️ Server Error'))
  })

  it('includes status metadata', () => {
    const err = formatApiError(500, 'Internal Server Error', 'tok')
    assert.ok(err.message.includes('- **Status**: 500'))
  })

  it('includes fix steps', () => {
    const err = formatApiError(503, 'Service Unavailable', 'tok')
    assert.ok(err.message.includes('**How to fix:**'))
  })

  it('sanitizes token from response', () => {
    const secret = 'sk-srv-secret'
    const err = formatApiError(502, `Gateway error with ${secret}`, secret)
    assert.ok(!err.message.includes(secret))
    assert.ok(err.message.includes('***'))
  })

  it('includes details when non-default body', () => {
    const err = formatApiError(500, 'Custom server error msg', 'tok')
    assert.ok(err.message.includes('Custom server error msg'))
  })
})
