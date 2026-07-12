/**
 * OpenCode GLM Quota Plugin
 * 
 * Query Z.ai GLM Coding Plan usage statistics including quota limits,
 * model usage, and MCP tool usage.
 */

import { type Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin/tool";
import * as fs from "fs";
import type { Platform } from "./api/platforms.js";
import { detectPlatform, getPlatformName } from "./api/platforms.js";
import { getEndpoints } from "./api/endpoints.js";
import { queryEndpoint } from "./api/client.js";
import { getTimeWindow, getTimeWindowQueryParams } from "./utils/time-window.js";
import { getAuthFilePathCandidates } from "./utils/auth-path.js";
import { formatProgressLine } from "./utils/progress-bar.js";
import {
  MAIN_TITLE_PREFIX,
  ROW_EMOJI,
  SECTION_HEADERS
} from "./utils/markdown-constants.js";
import { createMarkdownError } from "./utils/error-formatter.js";
import {
  FIVE_HOUR_TOKEN_LIMIT_LABEL,
  getTokenLimitLabel,
  isFiveHourTokenLimit
} from "./utils/token-limits.js";

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
  rawType?: string;
  unit?: number;
  number?: number;
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
  // Priority 1: OpenCode auth.json — probe EVERY candidate path (legacy
  // LOCALAPPDATA on Windows, then the cross-platform XDG path) so a stale or
  // partial file at one location does not mask valid credentials at another.
  for (const authPath of getAuthFilePathCandidates()) {
    if (!fs.existsSync(authPath)) continue;
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
      // Silent fail, try next candidate / fallback method
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
 * @returns Error message with setup instructions (Markdown formatted)
 */
function createCredentialError(): string {
  return createMarkdownError(
    'Credentials Not Found',
    {},
    'Please authenticate first.',
    [
      'Run `/connect` command in OpenCode TUI.',
      'Select "Z.AI Coding Plan", "Z.AI", or "Zhipu".',
      'For development/testing, set `ZAI_API_KEY` or `ZHIPU_API_KEY`.'
    ]
  );
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
            type: getTokenLimitLabel(limit),
            rawType: TOKEN_LIMIT_TYPE,
            unit: typeof limit.unit === 'number' ? limit.unit : undefined,
            number: typeof limit.number === 'number' ? limit.number : undefined,
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
  let hasFiveHourMatch = false;

  if (!quotaData?.limits) return { tokenLimit, tokenPct };

  for (const limit of quotaData.limits) {
    if (isFiveHourTokenLimit(limit)) {
      tokenPct = typeof limit.percentage === 'number' ? limit.percentage : 0;
      tokenLimit = (limit.total as number) || DEFAULT_TOKEN_LIMIT;
      hasFiveHourMatch = true;
      break;
    }
  }

  if (!hasFiveHourMatch) {
    for (const limit of quotaData.limits) {
      if (limit.rawType === TOKEN_LIMIT_TYPE || limit.type === FIVE_HOUR_TOKEN_LIMIT_LABEL) {
        tokenPct = typeof limit.percentage === 'number' ? limit.percentage : 0;
        tokenLimit = (limit.total as number) || DEFAULT_TOKEN_LIMIT;
        break;
      }
    }
  }

  return { tokenLimit, tokenPct };
}

/**
 * Format MCP tool details as readable lines
 */
function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatPlanLevel(level?: string): string {
  if (!level) {
    return '';
  }

  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function formatResetCell(resetTime?: number): string {
  const resetAt = asNumber(resetTime);
  if (resetAt === null) {
    return '—';
  }

  const diffMs = resetAt - Date.now();
  if (diffMs <= 0) {
    return '—';
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));

  // Format countdown portion
  let countdown: string;
  if (totalMinutes >= 24 * 60) {
    const totalHours = Math.floor(totalMinutes / 60);
    countdown = `${Math.floor(totalHours / 24)}d ${totalHours % 24}h`;
  } else {
    countdown = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  }

  // Format local reset time portion (Issue #34: show actual clock time)
  const resetDate = new Date(resetAt);
  const hh = String(resetDate.getHours()).padStart(2, '0');
  const mm = String(resetDate.getMinutes()).padStart(2, '0');

  if (totalMinutes >= 24 * 60) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${countdown} (${dayNames[resetDate.getDay()]} ${hh}:${mm})`;
  }

  return `${countdown} (${hh}:${mm})`;
}

function formatMarkdownTable(headers: string[], separator: string[], rows: string[][]): string {
  const tableRows = rows.map((row) => `| ${row.join(' | ')} |`);
  return [`| ${headers.join(' | ')} |`, `|${separator.join('|')}|`, ...tableRows].join('\n');
}

function formatMarkdownHeader(
  platformName: string,
  startTime: string,
  endTime: string,
  level?: string
): string {
  const title = level
    ? `${MAIN_TITLE_PREFIX}${formatPlanLevel(level)}`
    : '### 📊 Z.ai GLM Coding Plan';

  return [
    title,
    '',
    `- **Platform**: ${platformName}`,
    `- **Period**: ${startTime} → ${endTime}`
  ].join('\n');
}

function formatQuotaWindowLabel(type: string): string {
  if (type === FIVE_HOUR_TOKEN_LIMIT_LABEL) {
    return `${ROW_EMOJI.TOKEN} 5h Token`;
  }

  if (type === 'Token usage(Weekly)') {
    return `${ROW_EMOJI.WEEKLY} Weekly`;
  }

  if (type === MCP_LIMIT_LABEL) {
    return `${ROW_EMOJI.MCP} MCP (1 Month)`;
  }

  return type;
}

function formatQuotaLimitsTable(quotaData: ProcessedQuotaLimit | null): string {
  const rows = quotaData?.limits?.length
    ? quotaData.limits.map((limit) => {
      const percentage = typeof limit.percentage === 'number' ? limit.percentage : 0;
      return [
        formatQuotaWindowLabel(limit.type || 'Unknown'),
        `${percentage.toFixed(1)}%`,
        formatProgressLine(limit.type || 'Unknown', percentage),
        limit.type === MCP_LIMIT_LABEL ? '—' : formatResetCell(limit.nextResetTime)
      ];
    })
    : [['No quota data available', '—', '—', '—']];

  return formatMarkdownTable(
    ['Window', 'Usage', 'Progress', 'Resets In'],
    ['--------', '------:', '----------', '-----------'],
    rows
  );
}

function formatQuotaUsageTable(
  quotaData: ProcessedQuotaLimit | null,
  modelData: Record<string, unknown> | null
): string {
  const tokenCount = asNumber((modelData?.totalUsage as Record<string, unknown> | undefined)?.totalTokensUsage);
  const { tokenLimit } = getTokenLimitInfo(quotaData);
  const mcpLimit = quotaData?.limits?.find((limit) => limit.type === MCP_LIMIT_LABEL);
  const mcpCurrent = asNumber(mcpLimit?.currentValue);
  const mcpTotal = asNumber(mcpLimit?.total);

  return formatMarkdownTable(
    ['Metric', 'Value'],
    ['--------', '------:'],
    [
      ['💰 **Token Used**', tokenCount === null ? '—' : `**${formatNumber(tokenCount)} / ${formatNumber(tokenLimit)}**`],
      ['🔌 **MCP Used**', mcpCurrent === null || mcpTotal === null ? '—' : `**${mcpCurrent} / ${mcpTotal}**`]
    ]
  );
}

function formatMcpToolLabel(modelCode: string): string {
  if (modelCode === 'search-prime') {
    return '🔍 Network Searches';
  }

  if (modelCode === 'web-reader') {
    return '🌐 Web Reads';
  }

  if (modelCode === 'zread') {
    return '📖 ZRead Calls';
  }

  return modelCode;
}

function formatMcpBreakdownTable(quotaData: ProcessedQuotaLimit | null): string {
  const mcpLimit = quotaData?.limits?.find((limit) => limit.type === MCP_LIMIT_LABEL);
  const details = Array.isArray(mcpLimit?.usageDetails)
    ? mcpLimit.usageDetails as Array<{ modelCode: string; usage: number }>
    : [];
  const rows = details.length
    ? details.map((detail) => [formatMcpToolLabel(detail.modelCode), formatNumber(detail.usage)])
    : [['No MCP data available', '—']];

  return formatMarkdownTable(['Tool', 'Count'], ['------', '------:'], rows);
}

function formatModelUsageTable(
  modelData: Record<string, unknown> | null,
  quotaData: ProcessedQuotaLimit | null
): string {
  const totalUsage = modelData?.totalUsage as Record<string, unknown> | undefined;
  const rows: string[][] = [];
  const { tokenLimit, tokenPct } = getTokenLimitInfo(quotaData);
  const calls = asNumber(totalUsage?.totalModelCallCount);
  const tokens = asNumber(totalUsage?.totalTokensUsage);

  if (tokens !== null) {
    const pct24h = Math.round((tokens / tokenLimit) * 100);
    rows.push(['🔢 Total Tokens', `${formatNumber(tokens)} (${pct24h}% of 5h limit)`]);
    rows.push(['⏱️ 5h Window', `${tokenPct.toFixed(1)}% of ${formatNumber(tokenLimit)}`]);
  }

  if (calls !== null) {
    rows.push(['📞 Total Calls', formatNumber(calls)]);
  }

  return formatMarkdownTable(
    ['Metric', 'Value'],
    ['--------', '------:'],
    rows.length > 0 ? rows : [['No model usage data available', '—']]
  );
}

function formatToolUsageTable(toolData: Record<string, unknown> | null): string {
  const totalUsage = toolData?.totalUsage as Record<string, unknown> | undefined;
  const counts: Array<[string, number | null]> = [
    ['🔍 Network Searches', asNumber(totalUsage?.totalNetworkSearchCount)],
    ['🌐 Web Reads', asNumber(totalUsage?.totalWebReadMcpCount)],
    ['🎭 ZRead Calls', asNumber(totalUsage?.totalZreadMcpCount)]
  ];
  const rows = counts
    .filter(([, count]) => count !== null)
    .map(([label, count]) => [label, formatNumber(count as number)]);

  return formatMarkdownTable(
    ['Tool', 'Count'],
    ['------', '------:'],
    rows.length > 0 ? rows : [['No tool usage data available', '—']]
  );
}

function formatMarkdownOutput(
  platform: Platform,
  startTime: string,
  endTime: string,
  quotaData: ProcessedQuotaLimit | null,
  modelData: Record<string, unknown> | null,
  toolData: Record<string, unknown> | null
): string {
  const platformName = getPlatformName(platform);
  const level = quotaData?.level as string | undefined;

  return [
    formatMarkdownHeader(platformName, startTime, endTime, level),
    `${SECTION_HEADERS.QUOTA_LIMITS}\n\n${formatQuotaLimitsTable(quotaData)}`,
    `${SECTION_HEADERS.QUOTA_USAGE}\n\n${formatQuotaUsageTable(quotaData, modelData)}`,
    `${SECTION_HEADERS.MCP_BREAKDOWN}\n\n${formatMcpBreakdownTable(quotaData)}`,
    `${SECTION_HEADERS.MODEL_USAGE}\n\n${formatModelUsageTable(modelData, quotaData)}`,
    `${SECTION_HEADERS.TOOL_USAGE}\n\n${formatToolUsageTable(toolData)}`
  ].join('\n\n');
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
  
  return formatMarkdownOutput(platform, startTime, endTime, quotaData, modelData, toolData);
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

            if (errorMessage.trim().startsWith('### ⚠️ ')) {
              return errorMessage;
            }

            return createMarkdownError('Error', {}, errorMessage);
          }
        }
      })
    }
  }
};

export default GlmQuotaPlugin;
