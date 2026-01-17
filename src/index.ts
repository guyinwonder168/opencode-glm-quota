/**
 * OpenCode GLM Quota Plugin
 *
 * Query Z.ai GLM Coding Plan usage statistics including quota limits,
 * model usage, and MCP tool usage.
 */

import { type Plugin } from '@opencode-ai/plugin'
import { tool } from '@opencode-ai/plugin/tool'

/**
 * Platform type supported by plugin
 */
export type Platform = 'ZAI' | 'ZHIPU'

/**
 * Credentials for API authentication
 */
export interface Credentials {
  token: string
  platform: Platform
}

/**
 * Provider ID to platform mapping
 */
const PLATFORM_MAP = {
  'zai-coding-plan': 'ZAI',
  'zai': 'ZAI',
  'zhipu': 'ZHIPU',
  'zhipuai': 'ZHIPU'
} as const

/**
 * Get provider platform from provider ID
 * @param providerId - The provider ID from OpenCode authentication
 * @returns Platform type or null if unknown
 */
export function getProviderPlatform(providerId: string): Platform | null {
  return PLATFORM_MAP[providerId as keyof typeof PLATFORM_MAP] || null
}

/**
 * Create error message for missing credentials
 * @returns Error message with setup instructions
 */
export function createCredentialError(): string {
  return `No credentials found. Please authenticate by running /connect command in OpenCode.

Supported providers:
- Z.AI Coding Plan (recommended)
- Z.AI
- Zhipu

For development/testing, you can also set environment variables for appropriate platform.`
}

/**
 * Get credentials from OpenCode auth context or environment variables
 * @param authContext - Optional auth context from OpenCode plugin system
 * @returns Credentials object or null if no credentials found
 */
export async function getCredentials(authContext?: { providerId: string; token: string }): Promise<Credentials | null> {
  // Priority 1: OpenCode auth context
  if (authContext && authContext.providerId && authContext.token) {
    const platform = getProviderPlatform(authContext.providerId)
    if (platform) {
      return {
        token: authContext.token,
        platform
      }
    }
  }

  // Priority 2: Environment variables (fallback for development/testing)
  if (process.env.ZAI_API_KEY) {
    return {
      token: process.env.ZAI_API_KEY,
      platform: 'ZAI'
    }
  }

  if (process.env.ZHIPU_API_KEY || process.env.ZHIPUAI_API_KEY) {
    return {
      token: (process.env.ZHIPU_API_KEY || process.env.ZHIPUAI_API_KEY)!,
      platform: 'ZHIPU'
    }
  }

  // No credentials found
  return null
}

/**
 * Main GLM Quota Plugin
 */
export const GlmQuotaPlugin: Plugin = async () => {
  return {
    tool: {
      glm_quota: tool({
        description: 'Query Z.ai GLM Coding Plan usage statistics including quota limits, model usage, and MCP tool usage',
        args: {},
        async execute() {
          // TODO: Implement full feature in subsequent slices
          // For now, verify credential discovery works
          const credentials = await getCredentials()
          if (!credentials) {
            return createCredentialError()
          }
          return `✅ Credentials found for ${credentials.platform} platform\n\nFeature coming soon: quota limits, model usage, and MCP tool usage statistics.`
        }
      })
    }
  }
}
