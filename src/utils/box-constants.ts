/**
 * Box drawing layout constants
 * 
 * Box structure:
 * - Total line width: LEFT_BORDER (1) + LEFT_PAD (2) + CONTENT (56) + RIGHT_BORDER (1) = 60
 * - Border lines: ╔ + 58 chars + ╗ = 60 total
 * - Content lines: ║ + 2 spaces + 56 content + ║ = 60 total (formatted by formatBoxLine)
 */
export const BOX_WIDTH = {
  CONTENT: 56,      // Available content width
  BORDER_CHARS: 58, // Character count between borders (╔══...══╗)
  TOTAL: 60,        // Total line width including borders
  PADDING: 2        // Left/right padding inside box
} as const;

/**
 * Progress bar component widths
 * 
 * Format: "Label (20)  [Bar (12)] Pct (6)"
 * Layout calculation:
 * - Label: 20 chars
 * - Spacing: 2 chars ("  ")
 * - Bar brackets: 2 chars ("[" + "]")
 * - Bar content: 12 chars
 * - Spacing: 1 char (" ")
 * - Percentage: 6 chars ("100.0%")
 * Total: 20 + 2 + 1 + 12 + 1 + 1 + 6 = 43 chars (fits in CONTENT: 56)
 */
export const PROGRESS_BAR = {
  LABEL_WIDTH: 20,     // Label column width
  BAR_WIDTH: 12,       // Progress bar visual width
  PERCENTAGE_WIDTH: 6, // "100.0%" width
  DEFAULT_WIDTH: 30    // Default width when used standalone
} as const;

/**
 * Header title centering calculation
 * 
 * Title: " Z.ai GLM Coding Plan Usage Statistics " = 41 chars
 * padStart(35) + padEnd(58) centers it within 58-char border width
 */
export const HEADER = {
  TITLE_PAD_START: 35  // Center position for title
} as const;
