/**
 * HTTP client module
 * Makes HTTPS requests to Z.ai API endpoints
 */

import * as https from 'node:https';
import type { Endpoints } from './endpoints.js';
import { sanitizeToken } from '../utils/error-formatter.js';

/**
 * API response type
 */
interface ApiResponse {
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Network error with code property
 */
interface NetworkError extends Error {
  code?: string;
}

/**
 * HTTP request options
 */
interface RequestOptions {
  url: string;
  authToken: string;
  queryParams?: string;
}

/**
 * Format network error with boxed message
 * @param error - Network error object
 * @param authToken - Auth token to sanitize from error messages
 * @returns Formatted error with boxed message
 */
function formatNetworkError(error: NetworkError, authToken: string): Error {
  const code = error.code;
  let message = '';

  if (code === 'ETIMEDOUT') {
    message = createBoxedError('Request timed out. Please try again.');
  } else if (code === 'ECONNREFUSED') {
    message = createBoxedError('Unable to connect to server.');
  } else {
    // Other network errors - sanitize token from original message
    message = sanitizeToken(error.message, authToken);
  }

  const formattedError = new Error(message) as NetworkError;
  formattedError.code = code;
  return formattedError;
}

/**
 * Create a boxed error message with 60-character width
 * @param message - Error message to box
 * @returns Boxed error message
 */
function createBoxedError(message: string): string {
  const width = 60;
  const padding = 2;
  const contentWidth = width - (padding * 2) - 2; // -2 for border characters

  const lines: string[] = [];
  const words = message.split(' ');
  let currentLine = '';

  // Word wrap to fit content width
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= contentWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Build boxed output
  const topBorder = '╔' + '═'.repeat(width - 2) + '╗';
  const bottomBorder = '╚' + '═'.repeat(width - 2) + '╝';
  const paddedLines = lines.map(line => {
    const leftPad = ' '.repeat(padding);
    const rightPad = ' '.repeat(width - 2 - padding - line.length);
    return '║' + leftPad + line + rightPad + '║';
  });

  return [topBorder, ...paddedLines, bottomBorder].join('\n');
}

/**
 * Make HTTPS request to API endpoint
 * @param options - Request options
 * @returns Promise resolving to API response
 */
function makeRequest(options: RequestOptions): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(options.url);
    const fullPath = options.queryParams 
      ? `${parsedUrl.pathname}?${options.queryParams}` 
      : parsedUrl.pathname;

    const httpsOptions: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: fullPath,
      method: 'GET',
      headers: {
        'Authorization': options.authToken, // NO "Bearer" prefix
        'Accept-Language': 'en-US,en',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(httpsOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          return;
        }

        try {
          const json = JSON.parse(data) as ApiResponse;
          resolve(json);
        } catch {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    // Set 10-second timeout
    req.setTimeout(10000);

    req.on('timeout', () => {
      req.destroy();
      const timeoutError = new Error('Request timeout') as NetworkError;
      timeoutError.code = 'ETIMEDOUT';
      reject(formatNetworkError(timeoutError, options.authToken));
    });

    req.on('error', (error: NetworkError) => {
      reject(formatNetworkError(error, options.authToken));
    });

    req.end();
  });
}

/**
 * Query a single endpoint
 * @param endpoints - Endpoints configuration
 * @param authToken - Authentication token
 * @param endpointKey - Which endpoint to query ('modelUsage' | 'toolUsage' | 'quotaLimit')
 * @param queryParams - Optional query parameters
 * @returns Promise resolving to API response
 */
async function queryEndpoint(
  endpoints: Endpoints,
  authToken: string,
  endpointKey: 'modelUsage' | 'toolUsage' | 'quotaLimit',
  queryParams?: string
): Promise<ApiResponse> {
  const url = endpoints[endpointKey];
  return makeRequest({ url, authToken, queryParams });
}

export type { ApiResponse };
export { makeRequest, queryEndpoint, formatNetworkError, createBoxedError };
