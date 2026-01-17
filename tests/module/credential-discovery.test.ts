import { describe, test } from 'node:test'
import assert from 'node:assert'
import { getProviderPlatform, getCredentials, createCredentialError, type Credentials } from '../../dist/index.js'

describe('getProviderPlatform', () => {
  test('returns ZAI for zai-coding-plan provider ID', () => {
    // Arrange
    const providerId = 'zai-coding-plan'

    // Act
    const result = getProviderPlatform(providerId)

    // Assert
    assert.strictEqual(result, 'ZAI')
  })

  test('returns ZAI for zai provider ID', () => {
    // Arrange
    const providerId = 'zai'

    // Act
    const result = getProviderPlatform(providerId)

    // Assert
    assert.strictEqual(result, 'ZAI')
  })

  test('returns ZHIPU for zhipu provider ID', () => {
    // Arrange
    const providerId = 'zhipu'

    // Act
    const result = getProviderPlatform(providerId)

    // Assert
    assert.strictEqual(result, 'ZHIPU')
  })

  test('returns null for unknown provider ID', () => {
    // Arrange
    const providerId = 'unknown-provider'

    // Act
    const result = getProviderPlatform(providerId)

    // Assert
    assert.strictEqual(result, null)
  })
})

describe('getCredentials', () => {
  test('returns credentials from OpenCode auth context for ZAI', async () => {
    // Arrange
    const authContext = {
      providerId: 'zai-coding-plan',
      token: 'test-zai-token-123'
    }

    // Act
    const result = await getCredentials(authContext)

    // Assert
    assert.strictEqual(result?.token, 'test-zai-token-123')
    assert.strictEqual(result?.platform, 'ZAI')
  })

  test('returns credentials from OpenCode auth context for ZHIPU', async () => {
    // Arrange
    const authContext = {
      providerId: 'zhipu',
      token: 'test-zhipu-token-456'
    }

    // Act
    const result = await getCredentials(authContext)

    // Assert
    assert.strictEqual(result?.token, 'test-zhipu-token-456')
    assert.strictEqual(result?.platform, 'ZHIPU')
  })

  test('returns credentials from ZAI_API_KEY environment variable', async () => {
    // Arrange
    const originalEnv = process.env.ZAI_API_KEY
    process.env.ZAI_API_KEY = 'env-zai-token-789'

    // Act
    const result = await getCredentials()

    // Assert
    assert.strictEqual(result?.token, 'env-zai-token-789')
    assert.strictEqual(result?.platform, 'ZAI')

    // Cleanup
    if (originalEnv !== undefined) {
      process.env.ZAI_API_KEY = originalEnv
    } else {
      delete process.env.ZAI_API_KEY
    }
  })

  test('returns credentials from ZHIPU_API_KEY environment variable', async () => {
    // Arrange
    const originalEnv = process.env.ZHIPU_API_KEY
    process.env.ZHIPU_API_KEY = 'env-zhipu-token-012'

    // Act
    const result = await getCredentials()

    // Assert
    assert.strictEqual(result?.token, 'env-zhipu-token-012')
    assert.strictEqual(result?.platform, 'ZHIPU')

    // Cleanup
    if (originalEnv !== undefined) {
      process.env.ZHIPU_API_KEY = originalEnv
    } else {
      delete process.env.ZHIPU_API_KEY
    }
  })

  test('returns null when no credentials available', async () => {
    // Arrange
    const originalZaiEnv = process.env.ZAI_API_KEY
    const originalZhipuEnv = process.env.ZHIPU_API_KEY
    delete process.env.ZAI_API_KEY
    delete process.env.ZHIPU_API_KEY

    // Act
    const result = await getCredentials()

    // Assert
    assert.strictEqual(result, null)

    // Cleanup
    if (originalZaiEnv !== undefined) {
      process.env.ZAI_API_KEY = originalZaiEnv
    }
    if (originalZhipuEnv !== undefined) {
      process.env.ZHIPU_API_KEY = originalZhipuEnv
    }
  })

  test('prioritizes OpenCode auth context over environment variables', async () => {
    // Arrange
    const authContext = {
      providerId: 'zai',
      token: 'auth-context-token'
    }
    const originalEnv = process.env.ZAI_API_KEY
    process.env.ZAI_API_KEY = 'env-var-token'

    // Act
    const result = await getCredentials(authContext)

    // Assert
    assert.strictEqual(result?.token, 'auth-context-token')
    assert.strictEqual(result?.platform, 'ZAI')

    // Cleanup
    if (originalEnv !== undefined) {
      process.env.ZAI_API_KEY = originalEnv
    } else {
      delete process.env.ZAI_API_KEY
    }
  })
})

describe('createCredentialError', () => {
  test('returns error message with /connect command instruction', () => {
    // Arrange & Act
    const error = createCredentialError()

    // Assert
    assert.ok(error.includes('/connect'))
  })

  test('returns error message with platform information', () => {
    // Arrange & Act
    const error = createCredentialError()

    // Assert
    assert.ok(error.toLowerCase().includes('z.ai') || error.toLowerCase().includes('zhipu'))
  })

  test('returns error message without exposing any tokens', () => {
    // Arrange & Act
    const error = createCredentialError()

    // Assert
    // Ensure no token-like patterns are in error message
    assert.ok(!error.includes('test-token'))
    assert.ok(!error.includes('API_KEY'))
    assert.ok(!error.includes('bearer'))
  })
})

describe('Plugin Integration', () => {
  test('plugin throws credential error when no credentials available', async () => {
    // Arrange
    const originalZaiEnv = process.env.ZAI_API_KEY
    const originalZhipuEnv = process.env.ZHIPU_API_KEY
    delete process.env.ZAI_API_KEY
    delete process.env.ZHIPU_API_KEY

    const authContext = undefined

    // Act & Assert
    const credentials = await getCredentials(authContext)
    assert.strictEqual(credentials, null)

    // If no credentials, should be able to create error message
    const errorMessage = createCredentialError()
    assert.ok(errorMessage.length > 0)
    assert.ok(errorMessage.includes('/connect'))

    // Cleanup
    if (originalZaiEnv !== undefined) {
      process.env.ZAI_API_KEY = originalZaiEnv
    }
    if (originalZhipuEnv !== undefined) {
      process.env.ZHIPU_API_KEY = originalZhipuEnv
    }
  })

  test('plugin uses credentials from auth context when available', async () => {
    // Arrange
    const authContext = {
      providerId: 'zai-coding-plan',
      token: 'valid-auth-token'
    }

    // Act
    const credentials = await getCredentials(authContext)

    // Assert
    assert.notStrictEqual(credentials, null)
    assert.strictEqual(credentials?.token, 'valid-auth-token')
    assert.strictEqual(credentials?.platform, 'ZAI')
  })

  test('plugin handles invalid provider ID gracefully', async () => {
    // Arrange
    const authContext = {
      providerId: 'invalid-provider',
      token: 'some-token'
    }

    // Act
    const credentials = await getCredentials(authContext)

    // Assert
    // Invalid provider ID should not return credentials
    assert.strictEqual(credentials, null)
  })
})
