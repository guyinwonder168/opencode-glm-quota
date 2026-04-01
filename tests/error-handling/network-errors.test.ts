/**
 * Network Error Handling Tests (v1.7.0 Markdown format)
 * Tests for network-related errors (timeout, connection refused, etc.)
 */

import { describe, it } from 'node:test'
import * as assert from 'node:assert'
import { formatNetworkError, createMarkdownError } from '../../src/api/client.js'

interface NetworkError extends Error {
  code?: string
}

describe('Network Error Handling', () => {
  describe('formatNetworkError', () => {
    it('formats ETIMEDOUT with Markdown error', () => {
      const err = Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })
      const result = formatNetworkError(err, 'tok')
      assert.ok(result.message.includes('### ⚠️ Request Failed'))
      assert.ok(result.message.includes('timeout'))
      assert.strictEqual((result as NetworkError).code, 'ETIMEDOUT')
    })

    it('includes fix steps for ETIMEDOUT', () => {
      const err = Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })
      const result = formatNetworkError(err, 'tok')
      assert.ok(result.message.includes('**How to fix:**'))
    })

    it('formats ECONNREFUSED with Markdown error', () => {
      const err = Object.assign(new Error('refused'), { code: 'ECONNREFUSED' })
      const result = formatNetworkError(err, 'tok')
      assert.ok(result.message.includes('### ⚠️ Request Failed'))
      assert.ok(result.message.includes('Unable to connect'))
      assert.strictEqual((result as NetworkError).code, 'ECONNREFUSED')
    })

    it('sanitizes token for other error types', () => {
      const secret = 'sk-net-secret'
      const err = Object.assign(new Error(`Error with ${secret}`), { code: 'ENOTFOUND' })
      const result = formatNetworkError(err, secret)
      assert.ok(!result.message.includes(secret))
      assert.ok(result.message.includes('***'))
    })

    it('preserves error code', () => {
      const err = Object.assign(new Error('test'), { code: 'ETIMEDOUT' })
      const result = formatNetworkError(err, 'tok')
      assert.strictEqual((result as NetworkError).code, 'ETIMEDOUT')
    })
  })

  describe('createMarkdownError', () => {
    it('creates Markdown error with title', () => {
      const result = createMarkdownError('Test Error', {}, 'Something went wrong.')
      assert.ok(result.includes('### ⚠️ Test Error'))
      assert.ok(result.includes('Something went wrong.'))
    })

    it('creates Markdown error with metadata and steps', () => {
      const result = createMarkdownError(
        'Error', { Status: '500' }, 'Server failed.', ['Try again']
      )
      assert.ok(result.includes('- **Status**: 500'))
      assert.ok(result.includes('**How to fix:**'))
      assert.ok(result.includes('1. Try again'))
    })
  })
})
