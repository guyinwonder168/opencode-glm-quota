import { BOX_WIDTH } from './box-constants.js';

/**
 * Sanitizes error messages by replacing authentication tokens with ***
 * to prevent token exposure in logs and error outputs.
 * 
 * @param message - The error message that may contain a token
 * @param token - Optional authentication token to sanitize from the message
 * @returns The sanitized message with tokens replaced by ***
 */
export function sanitizeToken(message: string, token?: string): string {
  if (!token || token === '') {
    return message;
  }
  
  return message.replaceAll(token, '***');
}

/**
 * Create a boxed error message
 * Uses BOX_WIDTH constant for consistent formatting across the plugin
 * @param message - Error message to box
 * @returns Boxed error message
 */
export function createBoxedError(message: string): string {
  const width = BOX_WIDTH.TOTAL;
  const padding = BOX_WIDTH.PADDING;
  const contentWidth = BOX_WIDTH.CONTENT;
  const borderChars = BOX_WIDTH.BORDER_CHARS;

  const lines: string[] = [];
  const words = message.split(' ');
  let currentLine = '';

  // Word wrap to fit content width
  for (const word of words) {
    // If word is longer than content width, truncate it
    const ellipsisLength = 3; // Length of "..."
    const truncatedWord = word.length > contentWidth 
      ? `${word.substring(0, contentWidth - ellipsisLength)}...` 
      : word;
    
    if (currentLine.length + truncatedWord.length + 1 <= contentWidth) {
      currentLine += (currentLine ? ' ' : '') + truncatedWord;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = truncatedWord;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Build boxed output
  const topBorder = '╔' + '═'.repeat(borderChars) + '╗';
  const bottomBorder = '╚' + '═'.repeat(borderChars) + '╝';
  const paddedLines = lines.map(line => {
    const leftPad = ' '.repeat(padding);
    // rightPad calculation: total (60) - borders (2) - left pad (2) - content length
    const rightPad = ' '.repeat(Math.max(0, width - 2 - padding - line.length));
    return '║' + leftPad + line + rightPad + '║';
  });

  return [topBorder, ...paddedLines, bottomBorder].join('\n');
}
