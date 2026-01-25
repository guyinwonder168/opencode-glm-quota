/**
 * Progress bar module
 * Creates ASCII progress bars for quota visualization
 */

/**
 * Progress bar options
 */
export interface ProgressBarOptions {
  width?: number;       // Total width of bar (default: 30)
  filledChar?: string;  // Character for filled portion (default: '█')
  emptyChar?: string;   // Character for empty portion (default: '░')
}

/**
 * Create ASCII progress bar
 * @param percentage - Percentage (0-100)
 * @param options - Bar options
 * @returns Progress bar string
 */
export function createProgressBar(
  percentage: number,
  options: ProgressBarOptions = {}
): string {
  const {
    width = 30,
    filledChar = '█',
    emptyChar = '░'
  } = options;
  
  // Clamp percentage to 0-100
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  
  // Calculate filled width
  const filledWidth = Math.round((clampedPercentage / 100) * width);
  const emptyWidth = width - filledWidth;
  
  return filledChar.repeat(filledWidth) + emptyChar.repeat(emptyWidth);
}

/**
 * Format percentage with sign
 * @param percentage - Percentage value
 * @param decimals - Decimal places (default: 1)
 * @returns Formatted percentage string (e.g., '40.5%')
 */
export function formatPercentage(percentage: number, decimals: number = 1): string {
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Create full progress bar line for quota display
 * @param label - Label text
 * @param percentage - Percentage value
 * @param totalWidth - Total line width (default: 60)
 * @returns Formatted progress bar line
 */
export function formatProgressLine(
  label: string,
  percentage: number
): string {
  const bar = createProgressBar(percentage, { width: 26 });
  const pctStr = formatPercentage(percentage).padStart(6);
  const labelStr = label.slice(0, 20).padEnd(20);

  return `${labelStr} [${bar}] ${pctStr}`;
}
