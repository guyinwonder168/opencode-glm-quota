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
import { formatProgressLine } from "./utils/progress-bar.js";

// ============================================================================
// CONSTANTS
// ============================================================================

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
 * Format number with thousand separators
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format model usage data as readable lines
 */
function formatModelUsage(
  data: Record<string, unknown>,
  quotaData: ProcessedQuotaLimit | null
): string[] {
  const lines: string[] = [];
  const totalUsage = data.totalUsage as Record<string, unknown> | undefined;
  
  // Find token limit info from quota
  let tokenLimit = 40000000; // Default 40M
  let tokenPct = 0;
  if (quotaData?.limits) {
    for (const limit of quotaData.limits) {
      if (limit.type === 'Token usage(5 Hour)') {
        tokenPct = typeof limit.percentage === 'number' ? limit.percentage : 0;
        tokenLimit = (limit.total as number) || 40000000;
        break;
      }
    }
  }
  
  if (totalUsage) {
    const calls = totalUsage.totalModelCallCount as number | undefined;
    const tokens = totalUsage.totalTokensUsage as number | undefined;
    
    if (tokens !== undefined) {
      // Show 24h tokens and percentage relative to 5h limit
      const pct24h = Math.round((tokens / tokenLimit) * 100);
      lines.push(`  Total Tokens (24h): ${formatNumber(tokens)} (${pct24h}% of 5h limit)`);
      lines.push(`  5h Window Usage: ${tokenPct}% of ${formatNumber(tokenLimit)}`);
    }
    
    if (calls !== undefined) {
      lines.push(`  Total Calls: ${formatNumber(calls)}`);
    }
  } else {
    lines.push('  No usage data');
  }
  
  return lines;
}

/**
 * Format tool usage data as readable lines
 */
function formatToolUsage(
  data: Record<string, unknown>,
  quotaData: ProcessedQuotaLimit | null
): string[] {
  const lines: string[] = [];
  const totalUsage = data.totalUsage as Record<string, unknown> | undefined;
  
  // Calculate total tool calls for percentage
  if (totalUsage) {
    const search = totalUsage.totalNetworkSearchCount as number | undefined;
    const webRead = totalUsage.totalWebReadMcpCount as number | undefined;
    const zread = totalUsage.totalZreadMcpCount as number | undefined;
    
    if (search !== undefined) lines.push(`  Network Searches: ${formatNumber(search)}`);
    if (webRead !== undefined) lines.push(`  Web Reads: ${formatNumber(webRead)}`);
    if (zread !== undefined) lines.push(`  ZRead Calls: ${formatNumber(zread)}`);
  }
  
  // Show MCP usage details from quota if available
  if (quotaData?.limits) {
    for (const limit of quotaData.limits) {
      if (limit.type === 'MCP usage(1 Month)' && limit.usageDetails) {
        const details = limit.usageDetails as unknown as Array<{modelCode: string; usage: number}>;
        lines.push('  MCP Tool Details:');
        const mcpTotal = details.reduce((sum, d) => sum + (d.usage || 0), 0);
        for (const d of details) {
          const pct = mcpTotal > 0 ? Math.round((d.usage / mcpTotal) * 100) : 0;
          lines.push(`    - ${d.modelCode}: ${d.usage} (${pct}%)`);
        }
        break;
      }
    }
  }
  
  if (lines.length === 0) {
    lines.push('  No usage data');
  }
  
  return lines;
}

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
  
  // Constants for line width (total 60 chars)
  const LINE_WIDTH = 60;
  const LINE_CONTENT = 58; // Between ║ and ║
  const LINE_INDENT = 56;  // After "║  "
  
  // Header
  lines.push('╔' + '═'.repeat(58) + '╗');
  lines.push('║' + ' '.repeat(58) + '║');
  lines.push('║' + ' Z.ai GLM Coding Plan Usage Statistics '.padStart(35).padEnd(58) + '║');
  lines.push('║' + ' '.repeat(58) + '║');
  lines.push('╠' + '═'.repeat(58) + '╣');
  // Platform line: "║  Platform: " (13 chars) + name + padding + "║"
  lines.push('║  Platform: ' + platformName.padEnd(LINE_WIDTH - 13 - 1) + '║');
  // Period line: "║  Period:   " (14 chars) + start + " → " + end + "║"
  const periodLine = '║  Period:   ' + startTime + ' → ' + endTime;
  lines.push(periodLine.padEnd(LINE_WIDTH) + '║');
  lines.push('╠' + '═'.repeat(58) + '╣');
  
  // Quota Limits
  lines.push('║  📊 QUOTA LIMITS' + ' '.repeat(LINE_CONTENT - 14) + '║');
  lines.push('╟' + '─'.repeat(58) + '╢');
  
  if (quotaData?.limits && Array.isArray(quotaData.limits)) {
    for (const limit of quotaData.limits) {
      const pct = typeof limit.percentage === 'number' ? limit.percentage : 0;
      const line = formatProgressLine(limit.type || 'Unknown', pct);
      lines.push('║  ' + line.padEnd(LINE_INDENT) + '║');
      
      if (limit.currentValue !== undefined && limit.total !== undefined) {
        const usageStr = '       Used: ' + limit.currentValue + '/' + limit.total;
        lines.push('║  ' + usageStr.padEnd(LINE_INDENT) + '║');
      }
    }
  } else {
    lines.push('║  No quota data available' + ' '.repeat(LINE_INDENT - 21) + '║');
  }
  
  lines.push('╠' + '═'.repeat(58) + '╣');
  
  // Model Usage
  lines.push('║  🤖 MODEL USAGE (24h)' + ' '.repeat(LINE_INDENT - 17) + '║');
  lines.push('╟' + '─'.repeat(58) + '╢');
  
  if (modelData) {
    const modelLines = formatModelUsage(modelData, quotaData);
    for (const line of modelLines) {
      lines.push('║  ' + line.padEnd(LINE_INDENT) + '║');
    }
  } else {
    lines.push('║  No model usage data available' + ' '.repeat(LINE_INDENT - 25) + '║');
  }
  
  lines.push('╠' + '═'.repeat(58) + '╣');
  
  // Tool Usage
  lines.push('║  🔧 TOOL/MCP USAGE (24h)' + ' '.repeat(LINE_INDENT - 20) + '║');
  lines.push('╟' + '─'.repeat(58) + '╢');
  
  if (toolData) {
    const toolLines = formatToolUsage(toolData, quotaData);
    for (const line of toolLines) {
      lines.push('║  ' + line.padEnd(LINE_INDENT) + '║');
    }
  } else {
    lines.push('║  No tool usage data available' + ' '.repeat(LINE_INDENT - 24) + '║');
  }
  
  // Footer
  lines.push('╚' + '═'.repeat(58) + '╝');
  
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
        async execute() {
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
