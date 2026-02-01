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
import { formatTimeUntilReset } from "./utils/reset-timer.js";
import { BOX_WIDTH, HEADER } from "./utils/box-constants.js";
import { createBoxedError } from "./utils/error-formatter.js";

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

const DEFAULT_TOKEN_LIMIT = 40000000;
const TOKEN_LIMIT_LABEL = 'Token usage(5 Hour)';
const MCP_LIMIT_LABEL = 'MCP usage(1 Month)';
const TOKEN_LIMIT_TYPE = 'TOKENS_LIMIT';
const TIME_LIMIT_TYPE = 'TIME_LIMIT';

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
  nextResetTime?: number; // Unix timestamp in milliseconds
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
 * @returns Error message with setup instructions (box formatted)
 */
function createCredentialError(): string {
  const header = '❌ Z.ai Credentials Not Found';
  const instructions = [
    '',
    'Please authenticate first:',
    '',
    '1. Run /connect command in OpenCode TUI',
    '2. Select "Z.AI Coding Plan" or "Z.AI"',
    '3. Or "Zhipu" (for China region)',
    '',
    'For dev/testing, set environment:',
    '- ZAI_API_KEY (global)',
    '- ZHIPU_API_KEY (China)',
    ''
  ];

  const lines: string[] = [];
  lines.push('╔' + '═'.repeat(BOX_WIDTH.BORDER_CHARS) + '╗');
  lines.push('║' + ' '.repeat(BOX_WIDTH.BORDER_CHARS) + '║');
  lines.push(formatBoxLine(header, BOX_WIDTH.CONTENT));
  lines.push('║' + ' '.repeat(BOX_WIDTH.BORDER_CHARS) + '║');
  
  for (const instruction of instructions) {
    lines.push(formatBoxLine(instruction, BOX_WIDTH.CONTENT));
  }
  
  lines.push('╚' + '═'.repeat(BOX_WIDTH.BORDER_CHARS) + '╝');
  
  return lines.join('\n');
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

        if (limit.type === TOKEN_LIMIT_TYPE) {
          return {
            type: TOKEN_LIMIT_LABEL,
            percentage: typeof limit.percentage === 'number' ? limit.percentage : 0,
            nextResetTime: limit.nextResetTime as number | undefined
          };
        }

        if (limit.type === TIME_LIMIT_TYPE) {
          return {
            type: MCP_LIMIT_LABEL,
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
 * Get token limit information from quota data
 */
function getTokenLimitInfo(quotaData: ProcessedQuotaLimit | null): { tokenLimit: number; tokenPct: number } {
  let tokenLimit = DEFAULT_TOKEN_LIMIT;
  let tokenPct = 0;

  if (!quotaData?.limits) return { tokenLimit, tokenPct };

  for (const limit of quotaData.limits) {
    if (limit.type === TOKEN_LIMIT_LABEL) {
      tokenPct = typeof limit.percentage === 'number' ? limit.percentage : 0;
      tokenLimit = (limit.total as number) || DEFAULT_TOKEN_LIMIT;
      break;
    }
  }

  return { tokenLimit, tokenPct };
}

/**
 * Format MCP tool details as readable lines
 */
function formatMcpToolLines(details: Array<{modelCode: string; usage: number}>): string[] {
  const lines: string[] = [];
  const mcpTotal = details.reduce((sum, d) => sum + (d.usage || 0), 0);
  for (const d of details) {
    const pct = mcpTotal > 0 ? Math.round((d.usage / mcpTotal) * 100) : 0;
    lines.push(`    - ${d.modelCode}: ${d.usage} (${pct}%)`);
  }
  return lines;
}

function formatTokenUsageLines(tokens: number, tokenLimit: number, tokenPct: number): string[] {
  const pct24h = Math.round((tokens / tokenLimit) * 100);
  return [
    `  Total Tokens (24h): ${formatNumber(tokens)} (${pct24h}% of 5h limit)`,
    `  5h Window Usage: ${tokenPct}% of ${formatNumber(tokenLimit)}`
  ];
}

function formatModelUsageLines(totalUsage: Record<string, unknown>, quotaData: ProcessedQuotaLimit | null): string[] {
  const lines: string[] = [];
  const { tokenLimit, tokenPct } = getTokenLimitInfo(quotaData);
  const calls = totalUsage.totalModelCallCount as number | undefined;
  const tokens = totalUsage.totalTokensUsage as number | undefined;

  if (tokens !== undefined) {
    lines.push(...formatTokenUsageLines(tokens, tokenLimit, tokenPct));
  }

  if (calls !== undefined) {
    lines.push(`  Total Calls: ${formatNumber(calls)}`);
  }

  return lines;
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

  if (!totalUsage) {
    lines.push('  No usage data');
    return lines;
  }

  return formatModelUsageLines(totalUsage, quotaData);
}

/**
 * Format tool usage data as readable lines
 */
function formatToolUsageSummaryLines(totalUsage: Record<string, unknown> | undefined): string[] {
  if (!totalUsage) return [];

  const search = totalUsage.totalNetworkSearchCount as number | undefined;
  const webRead = totalUsage.totalWebReadMcpCount as number | undefined;
  const zread = totalUsage.totalZreadMcpCount as number | undefined;

  return [
    ...(search !== undefined ? [`  Network Searches: ${formatNumber(search)}`] : []),
    ...(webRead !== undefined ? [`  Web Reads: ${formatNumber(webRead)}`] : []),
    ...(zread !== undefined ? [`  ZRead Calls: ${formatNumber(zread)}`] : [])
  ];
}

function formatMcpUsageDetailLines(quotaData: ProcessedQuotaLimit | null): string[] {
  if (!quotaData?.limits) return [];

  for (const limit of quotaData.limits) {
    if (limit.type === MCP_LIMIT_LABEL && limit.usageDetails) {
      const details = limit.usageDetails as unknown as Array<{modelCode: string; usage: number}>;
      return ['  MCP Tool Details:', ...formatMcpToolLines(details)];
    }
  }

  return [];
}

function formatToolUsage(
  data: Record<string, unknown>,
  quotaData: ProcessedQuotaLimit | null
): string[] {
  const totalUsage = data.totalUsage as Record<string, unknown> | undefined;
  const lines = [
    ...formatToolUsageSummaryLines(totalUsage),
    ...formatMcpUsageDetailLines(quotaData)
  ];

  if (lines.length === 0) {
    return ['  No usage data'];
  }

  return lines;
}

// ============================================================================
// HELPER FUNCTIONS FOR OUTPUT FORMATTING
// ============================================================================

/**
 * Format a single line with box characters
 * @param content - Content to display (without padding)
 * @param lineIndent - Total line width after padding
 * @returns Formatted line with box characters
 */
function formatBoxLine(content: string, lineIndent: number): string {
  const trimmed = trimToDisplayWidth(content, lineIndent, 0);
  const padding = Math.max(lineIndent - getDisplayWidth(trimmed), 0);
  return '║  ' + trimmed + ' '.repeat(padding) + '║';
}

function formatProgressBoxLine(content: string, lineIndent: number): string {
  const gap = 2;
  const contentWidth = Math.max(lineIndent - gap, 0);
  const trimmed = trimToDisplayWidth(content, contentWidth, 0);
  const padding = Math.max(contentWidth - getDisplayWidth(trimmed), 0);
  return '║  ' + trimmed + ' '.repeat(padding + gap) + '║';
}

function getDisplayWidth(text: string): number {
  let width = 0;

  for (let i = 0; i < text.length; i += 1) {
    const codePoint = text.codePointAt(i);
    if (codePoint === undefined) {
      continue;
    }

    if (codePoint > 0xffff) {
      i += 1;
    }

    if (isControlCodePoint(codePoint) || isZeroWidthCodePoint(codePoint)) {
      continue;
    }

    width += isEmojiCodePoint(codePoint) || isFullWidthCodePoint(codePoint) ? 2 : 1;
  }

  return width;
}

function trimToDisplayWidth(text: string, maxWidth: number, reserveRightPadding: number): string {
  let width = 0;
  let result = '';
  const allowedWidth = Math.max(maxWidth - reserveRightPadding, 0);

  for (let i = 0; i < text.length; i += 1) {
    const codePoint = text.codePointAt(i);
    if (codePoint === undefined) {
      continue;
    }

    if (codePoint > 0xffff) {
      i += 1;
    }

    if (isControlCodePoint(codePoint) || isZeroWidthCodePoint(codePoint)) {
      continue;
    }

    const charWidth = isEmojiCodePoint(codePoint) || isFullWidthCodePoint(codePoint) ? 2 : 1;
    if (width + charWidth > allowedWidth) {
      break;
    }

    result += String.fromCodePoint(codePoint);
    width += charWidth;
  }

  return result;
}

function isControlCodePoint(codePoint: number): boolean {
  return codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f);
}

function isZeroWidthCodePoint(codePoint: number): boolean {
  return (
    codePoint === 0x200d ||
    codePoint === 0xfe0f ||
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f)
  );
}

function isEmojiCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x1f300 && codePoint <= 0x1f5ff) ||
    (codePoint >= 0x1f600 && codePoint <= 0x1f64f) ||
    (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) ||
    (codePoint >= 0x1f700 && codePoint <= 0x1f77f) ||
    (codePoint >= 0x1f780 && codePoint <= 0x1f7ff) ||
    (codePoint >= 0x1f800 && codePoint <= 0x1f8ff) ||
    (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
    (codePoint >= 0x1fa00 && codePoint <= 0x1faff) ||
    (codePoint >= 0x2600 && codePoint <= 0x26ff) ||
    (codePoint >= 0x2700 && codePoint <= 0x27bf)
  );
}

function isFullWidthCodePoint(codePoint: number): boolean {
  return (
    codePoint >= 0x1100 && (
      codePoint <= 0x115f ||
      codePoint === 0x2329 ||
      codePoint === 0x232a ||
      (codePoint >= 0x2e80 && codePoint <= 0x3247 && codePoint !== 0x303f) ||
      (codePoint >= 0x3250 && codePoint <= 0x4dbf) ||
      (codePoint >= 0x4e00 && codePoint <= 0xa4c6) ||
      (codePoint >= 0xa960 && codePoint <= 0xa97c) ||
      (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
      (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
      (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
      (codePoint >= 0xfe30 && codePoint <= 0xfe6b) ||
      (codePoint >= 0xff01 && codePoint <= 0xff60) ||
      (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
      (codePoint >= 0x1b000 && codePoint <= 0x1b001) ||
      (codePoint >= 0x1f200 && codePoint <= 0x1f251) ||
      (codePoint >= 0x20000 && codePoint <= 0x3fffd)
    )
  );
}

/**
 * Format header section
 * @param platformName - Platform name
 * @param startTime - Start time string
 * @param endTime - End time string
 * @returns Array of header lines
 */
function formatHeader(platformName: string, startTime: string, endTime: string): string[] {
  const lines: string[] = [];

  lines.push('╔' + '═'.repeat(BOX_WIDTH.BORDER_CHARS) + '╗');
  lines.push('║' + ' '.repeat(BOX_WIDTH.BORDER_CHARS) + '║');
  lines.push('║' + ' Z.ai GLM Coding Plan Usage Statistics '.padStart(HEADER.TITLE_PAD_START).padEnd(BOX_WIDTH.BORDER_CHARS) + '║');
  lines.push('║' + ' '.repeat(BOX_WIDTH.BORDER_CHARS) + '║');
  lines.push('╠' + '═'.repeat(BOX_WIDTH.BORDER_CHARS) + '╣');
  lines.push(formatBoxLine(`Platform: ${platformName}`, BOX_WIDTH.CONTENT));
  lines.push(formatBoxLine(`Period:   ${startTime} → ${endTime}`, BOX_WIDTH.CONTENT));
  lines.push('╠' + '═'.repeat(BOX_WIDTH.BORDER_CHARS) + '╣');

  return lines;
}

/**
 * Format quota limits section
 * @param quotaData - Quota limit data
 * @returns Array of quota lines
 */
function formatQuotaLimits(quotaData: ProcessedQuotaLimit | null): string[] {
  const lines: string[] = [];

  lines.push(formatBoxLine('QUOTA LIMITS', BOX_WIDTH.CONTENT));
  lines.push('╟' + '─'.repeat(BOX_WIDTH.BORDER_CHARS) + '╢');

  const limits = quotaData?.limits;
  if (limits && Array.isArray(limits)) {
    for (const limit of limits) {
      const pct = typeof limit.percentage === 'number' ? limit.percentage : 0;
      const line = formatProgressLine(limit.type || 'Unknown', pct);
      lines.push(formatProgressBoxLine(line, BOX_WIDTH.CONTENT));

      if (limit.nextResetTime !== undefined) {
        const resetMsg = formatTimeUntilReset(limit.nextResetTime);
        if (resetMsg) {
          lines.push(formatBoxLine(resetMsg, BOX_WIDTH.CONTENT));
        }
      }

      if (limit.currentValue !== undefined && limit.total !== undefined) {
        const usageStr = '       Used: ' + limit.currentValue + '/' + limit.total;
        lines.push(formatBoxLine(usageStr, BOX_WIDTH.CONTENT));
      }
    }
  } else {
    lines.push(formatBoxLine('No quota data available', BOX_WIDTH.CONTENT));
  }

  lines.push('╠' + '═'.repeat(BOX_WIDTH.BORDER_CHARS) + '╣');

  return lines;
}

/**
 * Format data section with optional data
 * @param title - Section title
 * @param data - Data object or null
 * @param formatter - Function to format data if present
 * @param noDataMessage - Message to show if no data
 * @param LINE_INDENT - Line indent width
 * @returns Array of section lines
 */
function formatDataSection(
  title: string,
  data: Record<string, unknown> | null,
  formatter: (data: Record<string, unknown>, quotaData: ProcessedQuotaLimit | null) => string[],
  quotaData: ProcessedQuotaLimit | null,
  noDataMessage: string,
  LINE_INDENT: number
): string[] {
  const lines: string[] = [];

  lines.push(formatBoxLine(title, LINE_INDENT));
  lines.push('╟' + '─'.repeat(BOX_WIDTH.BORDER_CHARS) + '╢');

  if (data) {
    const formattedLines = formatter(data, quotaData);
    for (const line of formattedLines) {
      lines.push(formatBoxLine(line, LINE_INDENT));
    }
  } else {
    lines.push(formatBoxLine(noDataMessage, LINE_INDENT));
  }

  lines.push('╠' + '═'.repeat(BOX_WIDTH.BORDER_CHARS) + '╣');

  return lines;
}

/**
 * Format footer section
 * @returns Footer lines
 */
function formatFooter(): string[] {
  return ['╚' + '═'.repeat(BOX_WIDTH.BORDER_CHARS) + '╝'];
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

  lines.push(...formatHeader(platformName, startTime, endTime));
  lines.push(...formatQuotaLimits(quotaData));
  lines.push(...formatDataSection(
    'MODEL USAGE (24h)',
    modelData,
    formatModelUsage,
    quotaData,
    'No model usage data available',
    BOX_WIDTH.CONTENT
  ));
  lines.push(...formatDataSection(
    'TOOL/MCP USAGE (24h)',
    toolData,
    formatToolUsage,
    quotaData,
    'No tool usage data available',
    BOX_WIDTH.CONTENT
  ));
  lines.push(...formatFooter());

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

            // If the error message is already boxed (starts with top border), return it as is
            if (errorMessage.trim().startsWith('╔') && errorMessage.includes('╚')) {
              return errorMessage;
            }

            // Otherwise, wrap the raw error in a box
            return createBoxedError(errorMessage);
          }
        }
      })
    }
  }
};

export default GlmQuotaPlugin;
