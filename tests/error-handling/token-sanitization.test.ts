import { describe, test } from 'node:test'
import * as assert from 'node:assert'
import { sanitizeToken } from '../../src/utils/error-formatter.js'

describe('sanitizeToken', () => {
  test('replaces token with *** when token appears in message', () => {
    // Arrange
    const message = 'Authentication failed with token abc123def456'
    const token = 'abc123def456'

    // Act
    const result = sanitizeToken(message, token)

    // Assert
    assert.strictEqual(result, 'Authentication failed with token ***')
  })

  test('returns original message when token is undefined', () => {
    // Arrange
    const message = 'Authentication failed'

    // Act
    const result = sanitizeToken(message, undefined)

    // Assert
    assert.strictEqual(result, 'Authentication failed')
  })

  test('returns original message when token is not in message', () => {
    // Arrange
    const message = 'Authentication failed'
    const token = 'abc123def456'

    // Act
    const result = sanitizeToken(message, token)

    // Assert
    assert.strictEqual(result, 'Authentication failed')
  })

  test('replaces all occurrences of token in message', () => {
    // Arrange
    const message = 'Token abc123 used in header. Token abc123 expired.'
    const token = 'abc123'

    // Act
    const result = sanitizeToken(message, token)

    // Assert
    assert.strictEqual(result, 'Token *** used in header. Token *** expired.')
  })

  test('handles empty token gracefully', () => {
    // Arrange
    const message = 'Authentication failed'
    const token = ''

    // Act
    const result = sanitizeToken(message, token)

    // Assert
    assert.strictEqual(result, 'Authentication failed')
  })

  test('is case-sensitive when matching tokens', () => {
    // Arrange
    const message = 'Token ABC123 is valid'
    const token = 'abc123'

    // Act
    const result = sanitizeToken(message, token)

    // Assert
    assert.strictEqual(result, 'Token ABC123 is valid')
  })
})
