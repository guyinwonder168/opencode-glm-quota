/**
 * Authentication Error Handling Tests (v1.7.0 Markdown format)
 * Tests for HTTP 401/403 authentication errors
 */

import { describe, it } from 'node:test'
import * as assert from 'node:assert'
import { formatAuthError } from '../../src/api/client.js'

describe('formatAuthError - 401', () => {
  it('formats 401 with Markdown header', () => {
    const err = formatAuthError(401, 'Unauthorized', 'tok')
    assert.ok(err.message.includes('### ⚠️ Authentication Failed'))
    assert.ok(err.message.includes('credentials'))
  })

  it('includes status metadata for 401', () => {
    const err = formatAuthError(401, 'Unauthorized', 'tok')
    assert.ok(err.message.includes('- **Status**: 401'))
  })

  it('includes fix steps for 401', () => {
    const err = formatAuthError(401, 'Unauthorized', 'tok')
    assert.ok(err.message.includes('**How to fix:**'))
  })

  it('sanitizes token from 401 response', () => {
    const secret = 'sk-auth-secret'
    const err = formatAuthError(401, `Invalid token ${secret}`, secret)
    assert.ok(!err.message.includes(secret))
    assert.ok(err.message.includes('***'))
  })

  it('includes details when response is non-default', () => {
    const err = formatAuthError(401, 'Token expired at 2026-01-01', 'tok')
    assert.ok(err.message.includes('Token expired'))
  })
})

describe('formatAuthError - 403', () => {
  it('formats 403 with Markdown header', () => {
    const err = formatAuthError(403, 'Forbidden', 'tok')
    assert.ok(err.message.includes('### ⚠️ Access Denied'))
    assert.ok(err.message.includes("don't have permission"))
  })

  it('includes status metadata for 403', () => {
    const err = formatAuthError(403, 'Forbidden', 'tok')
    assert.ok(err.message.includes('- **Status**: 403'))
  })

  it('includes fix steps for 403', () => {
    const err = formatAuthError(403, 'Forbidden', 'tok')
    assert.ok(err.message.includes('**How to fix:**'))
  })

  it('sanitizes token from 403 response', () => {
    const secret = 'sk-forbidden-secret'
    const err = formatAuthError(403, `Token ${secret} lacks permissions`, secret)
    assert.ok(!err.message.includes(secret))
    assert.ok(err.message.includes('***'))
  })
})
