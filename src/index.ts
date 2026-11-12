/**
 * OpenCode GLM Quota Plugin (V2 plugin API)
 *
 * Query Z.ai GLM Coding Plan usage statistics including quota limits,
 * model usage, and MCP tool usage.
 *
 * V2 notes:
 * - The plugin default-exports `Plugin.define({ id, setup(ctx) })` from
 *   `@opencode/plugin`; V1-style plugin functions do not load in OpenCode V2.
 * - The tool is registered through `ctx.tool.transform` and keeps the name
 *   `glm_quota`, so the existing `/glm_quota` command and the
 *   `glm-quota-exec` agent keep working.
 * - `options: { codemode: true }` also exposes the tool to Code Mode.
 * - Credential discovery lives in `utils/credentials.ts` and reads the
 *   OpenCode v2 SQLite store (opencode.db) first, then auth.json, then env.
 */

import { Plugin } from '@opencode/plugin';
import { getPlatformName } from './api/platforms.js';
import { getEndpoints } from './api/endpoints.js';
import { queryEndpoint } from './api/client.js';
import { getTimeWindow, getTimeWindowQueryParams } from './utils/time-window.js';
import { formatProgressLine } from './utils/progress-bar.js';
import {
  MAIN_TITLE_PREFIX,
  ROW_EMOJI,
  SECTION_HEADERS
} from './utils/markdown-constants.js';
import { createMarkdownError } from './utils/error-formatter.js';
import {
  FIVE_HOUR_TOKEN_LIMIT_LABEL,
  getTokenLimitLabel,
  isFiveHourTokenLimit
} from './utils/token-limits.js';
import type { Credentials } from './utils/credentials.js';
import { getCredentials } from './utils/credentials.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TOKEN_LIMIT = 40000000;
const MCP_LIMIT_LABEL = 'MCP usage(1 Month)';
const TOKEN_LIMIT_TYPE = 'TOKENS_LIMIT';
const CREDIT_LIMIT_TYPE = 'CREDIT_LIMIT';
const TIME_LIMIT_TYPE = 'TIME_LIMIT';

// ============================================================================
// TYPES
// ============================================================================

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
// RESPONSE PROCESSING
// ============================================================================

/**
 * Process quota limit response
 * @param data - Raw API response
 * @returns Processed response with human-readable types
 */
function processQuotaLimit(data: unknown): ProcessedQuotaLimit {
  const result = { ...(data as Record<string, unknown>) } as ProcessedQuotaLimit;
  if (result.limits && Array.isArray(result.limits)) {
    result.limits = result.limits.map((item) => {
      if (typeof item === 'object' && item !== null) {
        const limit = item as unknown as Record<string, unknown>;
        if (limit.type === TOKEN_LIMIT_TYPE || limit.type === CREDIT_LIMIT_TYPE) {
          return {
            type: getTokenLimitLabel(limit),
            rawType: limit.type,
            unit: typeof limit.unit === 'number' ? limit.unit : undefined,
            number: typeof limit.number === 'number' ? limit.number : undefined,
            percentage: typeof limit.percentage === 'number' ? limit.percentage : 0,
            currentValue: typeof limit.currentValue === 'number' ? limit.currentValue : undefined,
            total: typeof limit.usage === 'number' ? limit.usage : undefined,
            nextResetTime: typeof limit.nextResetTime === 'number' ? limit.nextResetTime : undefined
          };
        }
        if (limit.type === TIME_LIMIT_TYPE) {
          return {
            type: MCP_LIMIT_LABEL,
            percentage: typeof limit.percentage === 'number' ? limit.percentage : 0,
            currentValue: typeof limit.currentValue === 'number' ? limit.currentValue : undefined,
            total: typeof limit.usage === 'number' ? limit.usage : undefined,
            usageDetails: (limit.usageDetails !== null && typeof limit.usageDetails === 'object'
              ? limit.usageDetails
              : undefined) as Record<string, unknown> | undefined
          };
        }
      }
      return item;
    });
  }
  return result;
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
      tokenLimit = limit.total || DEFAULT_TOKEN_LIMIT;
      hasFiveHourMatch = true;
      break;
    }
  }
  if (!hasFiveHourMatch) {
    for (const limit of quotaData.limits) {
      if (limit.rawType === TOKEN_LIMIT_TYPE || limit.rawType === CREDIT_LIMIT_TYPE || limit.type === FIVE_HOUR_TOKEN_LIMIT_LABEL) {
        tokenPct = typeof limit.percentage === 'number' ? limit.percentage : 0;
        tokenLimit = limit.total || DEFAULT_TOKEN_LIMIT;
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

function formatPlanLevel(level: string | undefined): string {
  if (!level) {
    return '';
  }
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function formatResetCell(resetTime: number | undefined): string {
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
  level: string | undefined,
  credentials?: Credentials
): string {
  const title = level
    ? `${MAIN_TITLE_PREFIX}${formatPlanLevel(level)}`
    : '### 📊 Z.ai GLM Coding Plan';
  const lines = [
    title,
    '',
    `- **Platform**: ${platformName}`,
    `- **Period**: ${startTime} → ${endTime}`
  ];
  if (credentials) {
    lines.push(`- **Key**: ${credentials.label} (${credentials.source})`);
  }
  return lines.join('\n');
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
  return formatMarkdownTable(['Window', 'Usage', 'Progress', 'Resets In'], ['--------', '------:', '----------', '-----------'], rows);
}

function formatQuotaUsageTable(quotaData: ProcessedQuotaLimit | null, modelData: Record<string, unknown> | null): string {
  const tokenCount = asNumber((modelData?.totalUsage as Record<string, unknown> | undefined)?.totalTokensUsage);
  const { tokenLimit } = getTokenLimitInfo(quotaData);
  const mcpLimit = quotaData?.limits?.find((limit) => limit.type === MCP_LIMIT_LABEL);
  const mcpCurrent = asNumber(mcpLimit?.currentValue);
  const mcpTotal = asNumber(mcpLimit?.total);
  return formatMarkdownTable(['Metric', 'Value'], ['--------', '------:'], [
    ['💰 **Token Used**', tokenCount === null ? '—' : `**${formatNumber(tokenCount)} / ${formatNumber(tokenLimit)}**`],
    ['🔌 **MCP Used**', mcpCurrent === null || mcpTotal === null ? '—' : `**${mcpCurrent} / ${mcpTotal}**`]
  ]);
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
    ? mcpLimit.usageDetails
    : [];
  const rows = details.length
    ? details.map((detail) => [formatMcpToolLabel(String((detail as Record<string, unknown>).modelCode)), formatNumber(Number((detail as Record<string, unknown>).usage))])
    : [['No MCP data available', '—']];
  return formatMarkdownTable(['Tool', 'Count'], ['------', '------:'], rows);
}

function formatModelUsageTable(modelData: Record<string, unknown> | null, quotaData: ProcessedQuotaLimit | null, detailed: boolean): string {
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
  if (detailed && Array.isArray(totalUsage?.modelSummaryList)) {
    for (const model of totalUsage.modelSummaryList as Record<string, unknown>[]) {
      const name = typeof model.modelName === 'string' ? model.modelName : 'Unknown';
      const modelTokens = asNumber(model.totalTokens);
      rows.push([`🤖 ${name}`, modelTokens === null ? '—' : formatNumber(modelTokens)]);
    }
  }
  return formatMarkdownTable(['Metric', 'Value'], ['--------', '------:'], rows.length > 0 ? rows : [['No model usage data available', '—']]);
}

function formatToolUsageTable(toolData: Record<string, unknown> | null): string {
  const totalUsage = toolData?.totalUsage as Record<string, unknown> | undefined;
  const counts: [string, number | null][] = [
    ['🔍 Network Searches', asNumber(totalUsage?.totalNetworkSearchCount)],
    ['🌐 Web Reads', asNumber(totalUsage?.totalWebReadMcpCount)],
    ['🎭 ZRead Calls', asNumber(totalUsage?.totalZreadMcpCount)]
  ];
  const rows = counts
    .filter(([, count]) => count !== null)
    .map(([label, count]) => [label, formatNumber(count as number)]);
  return formatMarkdownTable(['Tool', 'Count'], ['------', '------:'], rows.length > 0 ? rows : [['No tool usage data available', '—']]);
}

function formatMarkdownOutput(
  credentials: Credentials,
  startTime: string,
  endTime: string,
  quotaData: ProcessedQuotaLimit | null,
  modelData: Record<string, unknown> | null,
  toolData: Record<string, unknown> | null,
  detailed: boolean
): string {
  const platformName = getPlatformName(credentials.platform);
  const level = quotaData?.level as string | undefined;
  return [
    formatMarkdownHeader(platformName, startTime, endTime, level, credentials),
    `${SECTION_HEADERS.QUOTA_LIMITS}\n\n${formatQuotaLimitsTable(quotaData)}`,
    `${SECTION_HEADERS.QUOTA_USAGE}\n\n${formatQuotaUsageTable(quotaData, modelData)}`,
    `${SECTION_HEADERS.MCP_BREAKDOWN}\n\n${formatMcpBreakdownTable(quotaData)}`,
    `${SECTION_HEADERS.MODEL_USAGE}\n\n${formatModelUsageTable(modelData, quotaData, detailed)}`,
    `${SECTION_HEADERS.TOOL_USAGE}\n\n${formatToolUsageTable(toolData)}`
  ].join('\n\n');
}

// ============================================================================
// CREDENTIAL ERROR
// ============================================================================

/**
 * Create error message for missing credentials
 * @returns Error message with Markdown formatting
 */
function createCredentialError(): string {
  return createMarkdownError('Credentials Not Found', {}, 'Please authenticate first.', [
    'Run `/connect` command in OpenCode TUI.',
    'Select "Z.AI Coding Plan", "Z.AI", or "Zhipu".',
    'OpenCode v2 keeps keys in `~/.local/share/opencode/opencode.db` (table `credential`) — check there is an active Z.AI row and that the `sqlite3` CLI is available.',
    'For development/testing, set `ZAI_API_KEY` or `ZHIPU_API_KEY`.'
  ]);
}

// ============================================================================
// MAIN QUERY FUNCTION
// ============================================================================

/**
 * Query all usage statistics
 * @param credentials - API credentials
 * @param detailed - Include per-model usage breakdown
 * @returns Formatted output string
 */
async function queryAllUsage(credentials: Credentials, detailed: boolean): Promise<string> {
  const endpoints = getEndpoints(credentials.platform);
  const { startTime, endTime } = getTimeWindow();
  const queryParams = getTimeWindowQueryParams();
  // Query all endpoints
  const [quotaResponse, modelResponse, toolResponse] = await Promise.all([
    queryEndpoint(endpoints, credentials.token, 'quotaLimit').catch(() => null),
    queryEndpoint(endpoints, credentials.token, 'modelUsage', queryParams).catch(() => null),
    queryEndpoint(endpoints, credentials.token, 'toolUsage', queryParams).catch(() => null)
  ]);
  // Process responses
  const quotaData = quotaResponse
    ? processQuotaLimit(quotaResponse.data)
    : null;
  const modelData = modelResponse
    ? ((modelResponse.data || modelResponse) as Record<string, unknown>)
    : null;
  const toolData = toolResponse
    ? ((toolResponse.data || toolResponse) as Record<string, unknown>)
    : null;
  return formatMarkdownOutput(credentials, startTime, endTime, quotaData, modelData, toolData, detailed);
}

/**
 * Execute the GLM quota query and return the Markdown report.
 * Testable core shared by the plugin tool executor and the test suite.
 * @param input - Tool input (`detailed` adds per-model usage breakdown)
 * @returns Markdown report or Markdown error message
 */
export async function executeGlmQuota(input?: { detailed?: boolean }): Promise<string> {
  const detailed = input?.detailed === true;
  try {
    const credentials = await getCredentials();
    if (!credentials) {
      return createCredentialError();
    }
    return await queryAllUsage(credentials, detailed);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.trim().startsWith('### ⚠️ ')) {
      return errorMessage;
    }
    return createMarkdownError('Error', {}, errorMessage);
  }
}

// ============================================================================
// PLUGIN (V2)
// ============================================================================

export default Plugin.define({
  id: 'glm-quota',
  async setup(ctx) {
    await ctx.tool.transform((editor) => {
      editor.add({
        name: 'glm_quota',
        description:
          'Query Z.ai GLM Coding Plan usage statistics including quota limits, model usage, and MCP tool usage',
        input: {
          type: 'object',
          properties: {
            detailed: {
              type: 'boolean',
              description: 'Show detailed usage breakdown (per-model token usage)'
            }
          },
          required: [],
          additionalProperties: false
        },
        options: { codemode: true },
        async execute(input: unknown) {
          const args = (input ?? {}) as { detailed?: boolean };
          return { content: await executeGlmQuota(args) };
        }
      });
    });
  }
});
