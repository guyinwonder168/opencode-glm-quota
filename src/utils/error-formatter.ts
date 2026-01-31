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
    return message
  }
  
  return message.replaceAll(token, '***')
}
