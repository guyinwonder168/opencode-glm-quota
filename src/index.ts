/**
 * OpenCode GLM Quota Plugin
 * 
 * Query Z.ai GLM Coding Plan usage statistics including quota limits,
 * model usage, and MCP tool usage.
 */

import { type Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin/tool";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { Platform } from "./api/platforms.js";
import { detectPlatform, getPlatformName } from "./api/platforms.js";
import { getEndpoints } from "./api/endpoints.js";
import { queryEndpoint } from "./api/client.js";
import { getTimeWindow, getTimeWindowQueryParams } from "./utils/time-window.js";
import { createProgressBar, formatProgressLine } from "./utils/progress-bar.js";

// ============================================================================
// CONSTANTS
// ============================================================================

const PLUGIN_VERSION = "1.0.0";

const CANDIDATE_PROVIDER_IDS = [
  'zai-coding-plan',
  'zai',
  'z-ai',
  'z.ai',
  'zhipu',
  'zhipuai'
] as const;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Credentials for API authentication
 */
interface Credentials {
  token: string;
  platform: Platform;
}

/**
 * Quota limit item from API response
 */
interface QuotaLimitItem {
  type: string;
  percentage: number;
  currentValue?: number;
  total?: number;
  usageDetails?: Record<string, unknown>;
}

/**
 * Processed quota limit response
 */
interface ProcessedQuotaLimit {
  limits?: QuotaLimitItem[];
  [key: string]: unknown;
}

// ============================================================================
// CREDENTIAL DISCOVERY
// ============================================================================

/**
 * Get auth file path based on platform
 * @returns Path to auth.json file
 */
function getAuthFilePath(): string {
  if (process.platform === 'win32') {
    return path.join(
      process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
      'opencode',
      'auth.json'
    );
  }
  return path.join(os.homedir(), '.local', 'share', 'opencode', 'auth.json');
}

/**
 * Extract API key from auth entry
 * @param entry - Auth entry (string or object)
 * @returns API key or null
 */
function extractKeyFromEntry(entry: unknown): string | null {
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object' && entry !== null) {
    const obj = entry as Record<string, unknown>;
    for (const keyName of ['apiKey', 'api_key', 'token', 'key', 'accessToken', 'auth_token']) {
      if (typeof obj[keyName] === 'string') return obj[keyName] as string;
    }
  }
  return null;
}

/**
 * Get credentials from OpenCode auth.json or environment variables
 * @returns Credentials or null if not found
 */
async function getCredentials(): Promise<Credentials | null> {
  // Priority 1: OpenCode auth.json
  const authPath = getAuthFilePath();
  if (fs.existsSync(authPath)) {
    try {
      const content = fs.readFileSync(authPath, 'utf-8');
      const authData = JSON.parse(content) as Record<string, unknown>;
      
      for (const providerId of CANDIDATE_PROVIDER_IDS) {
        const entry = authData[providerId];
        if (entry) {
          const token = extractKeyFromEntry(entry);
          if (token) {
            const platform = detectPlatform(providerId);
            if (platform) {
              return { token, platform };
            }
          }
        }
      }
    } catch {
      // Silent fail, try next method
    }
  }

  // Priority 2: Environment variables (for development/testing)
  if (process.env.ZAI_API_KEY) {
    return { token: process.env.ZAI_API_KEY, platform: 'ZAI' };
  }
  
  if (process.env.ZHIPU_API_KEY || process.env.ZHIPUAI_API_KEY) {
    return {
      token: (process.env.ZHIPU_API_KEY || process.env.ZHIPUAI_API_KEY)!,
      platform: 'ZHIPU'
    };
  }

  return null;
}

/**
 * Create error message for missing credentials
 * @returns Error message with setup instructions
 */
function createCredentialError(): string {
  return `❌ Z.ai Credentials Not Found

Please authenticate first:

1. Run '/connect' command in OpenCode TUI
2. Select "Z.AI Coding Plan" or "Z.AI" (for global)
3. Or "Zhipu" (for China region)

For development/testing, you can also set environment variables:
  - ZAI_API_KEY (global platform)
  - ZHIPU_API_KEY or ZHIPUAI_API_KEY (China platform)`;
}

// ============================================================================
// RESPONSE PROCESSING
// ============================================================================

/**
 * Process quota limit response
 * @param data - Raw API response
 * @returns Processed response with human-readable types
 */
function processQuotaLimit(data: Record<string, unknown>): ProcessedQuotaLimit {
  const result = { ...data };
  
  if (result.limits && Array.isArray(result.limits)) {
    result.limits = result.limits.map((item: unknown) => {
      if (typeof item === 'object' && item !== null) {
        const limit = item as Record<string, unknown>;
        
        if (limit.type === 'TOKENS_LIMIT') {
          return {
            type: 'Token usage(5 Hour)',
            percentage: typeof limit.percentage === 'number' ? limit.percentage : 0
          };
        }
        
        if (limit.type === 'TIME_LIMIT') {
          return {
            type: 'MCP usage(1 Month)',
            percentage: typeof limit.percentage === 'number' ? limit.percentage : 0,
            currentValue: limit.currentValue,
            total: limit.usage,
            usageDetails: limit.usageDetails as Record<string, unknown> | undefined
          };
        }
      }
      return item;
    });
  }
  
  return result as ProcessedQuotaLimit;
}

// ============================================================================
// OUTPUT FORMATTING
// ============================================================================

/**
 * Format usage statistics as ASCII table
 * @param platform - Platform name
 * @param startTime - Start time string
 * @param endTime - End time string
 * @param quotaData - Quota limit data
 * @param modelData - Model usage data
 * @param toolData - Tool usage data
 * @returns Formatted output string
 */
function formatOutput(
  platform: Platform,
  startTime: string,
  endTime: string,
  quotaData: ProcessedQuotaLimit | null,
  modelData: Record<string, unknown> | null,
  toolData: Record<string, unknown> | null
): string {
  const lines: string[] = [];
  const platformName = getPlatformName(platform);
  
  // Header
  lines.push('╔════════════════════════════════════════════════════════════╗');
  lines.push('║           Z.ai GLM Coding Plan Usage Statistics            ║');
  lines.push('╠════════════════════════════════════════════════════════════╣');
  lines.push(`║  Platform: ${platformName.padEnd(47)}║`);
  lines.push(`║  Period: ${startTime} → ${endTime}  ║`);
  lines.push('╠════════════════════════════════════════════════════════════╣');
  
  // Quota Limits
  lines.push('║  📊 QUOTA LIMITS                                           ║');
  lines.push('╟────────────────────────────────────────────────────────────╢');
  
  if (quotaData?.limits && Array.isArray(quotaData.limits)) {
    for (const limit of quotaData.limits) {
      const pct = typeof limit.percentage === 'number' ? limit.percentage : 0;
      const line = formatProgressLine(limit.type || 'Unknown', pct);
      lines.push(`║  ${line.padEnd(56)}║`);
      
      if (limit.currentValue !== undefined && limit.total !== undefined) {
        const usageStr = `       Used: ${limit.currentValue}/${limit.total}`.padEnd(56);
        lines.push(`║  ${usageStr}║`);
      }
    }
  } else {
    lines.push('║  No quota data available                                   ║');
  }
  
  lines.push('╠════════════════════════════════════════════════════════════╣');
  
  // Model Usage
  lines.push('║  🤖 MODEL USAGE (24h)                                      ║');
  lines.push('╟────────────────────────────────────────────────────────────╢');
  
  if (modelData) {
    const modelJson = JSON.stringify(modelData, null, 2);
    const modelLines = modelJson.split('\n').slice(0, 8);
    for (const line of modelLines) {
      lines.push(`║  ${line.substring(0, 56).padEnd(56)}║`);
    }
    if (modelJson.split('\n').length > 8) {
      lines.push('║  ...                                                       ║');
    }
  } else {
    lines.push('║  No model usage data available                             ║');
  }
  
  lines.push('╠════════════════════════════════════════════════════════════╣');
  
  // Tool Usage
  lines.push('║  🔧 TOOL/MCP USAGE (24h)                                   ║');
  lines.push('╟────────────────────────────────────────────────────────────╢');
  
  if (toolData) {
    const toolJson = JSON.stringify(toolData, null, 2);
    const toolLines = toolJson.split('\n').slice(0, 8);
    for (const line of toolLines) {
      lines.push(`║  ${line.substring(0, 56).padEnd(56)}║`);
    }
    if (toolJson.split('\n').length > 8) {
      lines.push('║  ...                                                       ║');
    }
  } else {
    lines.push('║  No tool usage data available                              ║');
  }
  
  // Footer
  lines.push('╚════════════════════════════════════════════════════════════╝');
  
  return lines.join('\n');
}

// ============================================================================
// MAIN QUERY FUNCTION
// ============================================================================

/**
 * Query all usage statistics
 * @param credentials - API credentials
 * @returns Formatted output string
 */
async function queryAllUsage(credentials: Credentials): Promise<string> {
  const { token, platform } = credentials;
  const endpoints = getEndpoints(platform);
  const { startTime, endTime } = getTimeWindow();
  const queryParams = getTimeWindowQueryParams();
  
  // Query all endpoints
  const [quotaResponse, modelResponse, toolResponse] = await Promise.all([
    queryEndpoint(endpoints, token, 'quotaLimit').catch(() => null),
    queryEndpoint(endpoints, token, 'modelUsage', queryParams).catch(() => null),
    queryEndpoint(endpoints, token, 'toolUsage', queryParams).catch(() => null)
  ]);
  
  // Process responses
  const quotaData = quotaResponse 
    ? processQuotaLimit(quotaResponse.data as Record<string, unknown>) 
    : null;
  
  const modelData = modelResponse 
    ? (modelResponse.data || modelResponse) as Record<string, unknown> 
    : null;
  
  const toolData = toolResponse 
    ? (toolResponse.data || toolResponse) as Record<string, unknown> 
    : null;
  
  return formatOutput(platform, startTime, endTime, quotaData, modelData, toolData);
}

// ============================================================================
// PLUGIN EXPPORT
// ============================================================================

export const GlmQuotaPlugin: Plugin = async () => {
  return {
    tool: {
      glm_quota: tool({
        description: 'Query Z.ai GLM Coding Plan usage statistics including quota limits, model usage, and MCP tool usage',
        args: {},
        async execute(_args, _context) {
          try {
            const credentials = await getCredentials();
            
            if (!credentials) {
              return createCredentialError();
            }
            
            return await queryAllUsage(credentials);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `❌ Error: ${errorMessage}`;
          }
        }
      })
    }
  }
};

export default GlmQuotaPlugin;
