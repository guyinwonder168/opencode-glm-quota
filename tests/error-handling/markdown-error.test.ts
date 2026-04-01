/**
 * Tests for createMarkdownError (v1.7.0 Markdown format)
 */

import { describe, test } from 'node:test'
import * as assert from 'node:assert'
import { createMarkdownError } from '../../src/utils/error-formatter.js'

describe('createMarkdownError', () => {
  test('formats error with title, metadata, description, and steps', () => {
    const result = createMarkdownError(
      'Authentication Failed',
      { Platform: 'ZAI', Status: '401' },
      'Your token was rejected by the API.',
      ['Run `/connect` to re-authenticate', 'Check if your subscription has expired']
    )

    assert.ok(result.startsWith('### ⚠️ Authentication Failed'))
    assert.ok(result.includes('- **Platform**: ZAI'))
    assert.ok(result.includes('- **Status**: 401'))
    assert.ok(result.includes('Your token was rejected by the API.'))
    assert.ok(result.includes('**How to fix:**'))
    assert.ok(result.includes('1. Run `/connect` to re-authenticate'))
    assert.ok(result.includes('2. Check if your subscription has expired'))
  })

  test('formats error without steps', () => {
    const result = createMarkdownError(
      'Server Error',
      { Status: '500' },
      'Internal server error occurred.'
    )

    assert.ok(result.startsWith('### ⚠️ Server Error'))
    assert.ok(result.includes('- **Status**: 500'))
    assert.ok(result.includes('Internal server error occurred.'))
    assert.ok(!result.includes('**How to fix:**'))
    assert.ok(!result.includes('1.'))
  })

  test('formats error with empty metadata', () => {
    const result = createMarkdownError(
      'Request Failed',
      {},
      'Connection timeout.',
      ['Check your network connection']
    )

    assert.strictEqual(result.startsWith('### ⚠️ Request Failed'), true)
    assert.ok(result.includes('Connection timeout.'))
    assert.ok(result.includes('**How to fix:**'))
    assert.ok(result.includes('1. Check your network connection'))
    // No metadata bullet lines
    assert.ok(!result.includes('- **'))
  })

  test('formats error with single step', () => {
    const result = createMarkdownError(
      'Parse Error',
      {},
      'Invalid JSON response.',
      ['Try again later']
    )

    assert.ok(result.includes('1. Try again later'))
    assert.ok(!result.includes('2.'))
  })

  test('uses ERROR_FORMAT constants from markdown-constants', () => {
    const result = createMarkdownError(
      'Test Error',
      {},
      'Test description.'
    )

    // Title should start with the prefix from ERROR_FORMAT
    assert.ok(result.startsWith('### ⚠️ '))
  })

  test('preserves order of metadata keys', () => {
    const result = createMarkdownError(
      'Test',
      { Alpha: '1', Beta: '2', Gamma: '3' },
      'desc'
    )

    const alphaIdx = result.indexOf('- **Alpha**: 1')
    const betaIdx = result.indexOf('- **Beta**: 2')
    const gammaIdx = result.indexOf('- **Gamma**: 3')

    assert.ok(alphaIdx < betaIdx, 'Alpha should come before Beta')
    assert.ok(betaIdx < gammaIdx, 'Beta should come before Gamma')
  })

  test('separates sections with blank lines', () => {
    const result = createMarkdownError(
      'Test',
      { Key: 'Value' },
      'Description.',
      ['Step 1']
    )

    // Title followed by blank line, then metadata
    const titleEnd = result.indexOf('\n\n', result.indexOf('### ⚠️'))
    assert.ok(titleEnd > 0, 'Title should be followed by blank line')

    // Steps section should be preceded by blank line
    assert.ok(result.includes('\n\n**How to fix:**'), 'Fix header should be preceded by blank line')
  })
})
