/**
 * JSON Parse Error Handling Tests (v1.7.0 Markdown format)
 */

import { describe, it } from 'node:test'
import * as assert from 'node:assert'
import { formatParseError } from '../../src/api/client.js'

describe('formatParseError', () => {
  it('formats parse error with Markdown header', () => {
    const err = formatParseError('This is not JSON', 'tok')
    assert.ok(err.message.includes('### ⚠️ Unexpected Response'))
    assert.ok(err.message.includes('Invalid JSON'))
  })

  it('includes fix steps', () => {
    const err = formatParseError('bad data', 'tok')
    assert.ok(err.message.includes('**How to fix:**'))
  })

  it('includes details when body is present', () => {
    const err = formatParseError('Some malformed data', 'tok')
    assert.ok(err.message.includes('Some malformed data'))
  })

  it('sanitizes token from response body', () => {
    const secret = 'sk-parse-secret'
    const err = formatParseError(`Invalid JSON with ${secret} exposed`, secret)
    assert.ok(!err.message.includes(secret))
    assert.ok(err.message.includes('***'))
  })

  it('truncates very long response bodies', () => {
    const longBody = 'X'.repeat(500) + ' not JSON'
    const err = formatParseError(longBody, 'tok')
    assert.ok(err.message.includes('Invalid JSON'))
    assert.ok(!err.message.includes('X'.repeat(300)))
  })

  it('handles empty response body', () => {
    const err = formatParseError('', 'tok')
    assert.ok(err.message.includes('Invalid JSON'))
    assert.ok(err.message.includes('malformed data'))
  })

  it('handles malformed JSON', () => {
    const err = formatParseError('{"broken": "json"', 'tok')
    assert.ok(err.message.includes('Invalid JSON'))
  })
})
