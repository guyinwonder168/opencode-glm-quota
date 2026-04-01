/**
 * Markdown output constants for OpenCode Glamour TUI.
 *
 * Glamour TUI renders: GFM tables, headers (h1-h6), bold, italic,
 * code spans, and lists.
 * Glamour TUI does NOT render: --- rules, > blockquotes, HTML.
 */

// ============================================================
// v1.7.0 Markdown Format Constants
// ============================================================

/** Main title prefix for usage report header */
export const MAIN_TITLE_PREFIX = '### 📊 Z.ai GLM Coding Plan — ' as const

/** Section headers for report sections */
export const SECTION_HEADERS = {
  QUOTA_LIMITS: '##### 🪙 Quota Limits',
  QUOTA_USAGE: '##### 📊 Quota Usage',
  MCP_BREAKDOWN: '##### 🔧 MCP Tool Breakdown',
  MODEL_USAGE: '##### 🤖 Model Usage (24h)',
  TOOL_USAGE: '##### 🛠️ Tool Usage (24h)',
} as const

/** Row label emojis for quota table */
export const ROW_EMOJI = {
  TOKEN: '⏱️',
  WEEKLY: '📅',
  MCP: '🔌',
} as const

/** Error format markers */
export const ERROR_FORMAT = {
  TITLE_PREFIX: '### ⚠️ ',
  FIX_HEADER: '**How to fix:**',
} as const

// ============================================================
// Legacy constants (removed in Slices 2-5)
// ============================================================

/** @deprecated Remove after Slice 5 rewrites index.ts */
export const BOX_WIDTH = {
  CONTENT: 56,
  BORDER_CHARS: 58,
  TOTAL: 60,
  PADDING: 2,
} as const

/** @deprecated Remove after Slice 5 rewrites index.ts */
export const HEADER = {
  TITLE_PAD_START: 35,
} as const

/** Progress bar characters and width for Markdown code spans */
export const PROGRESS_BAR = {
  WIDTH: 12,
  FILLED: '█',
  EMPTY: '░',
} as const
