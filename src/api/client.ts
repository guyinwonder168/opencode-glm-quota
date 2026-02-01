/**
 * HTTP client module
 * Makes HTTPS requests to Z.ai API endpoints
 */

import * as https from 'node:https';
import type { Endpoints } from './endpoints.js';
import { sanitizeToken, createBoxedError } from '../utils/error-formatter.js';

/**
 * HTTP request timeout in milliseconds (10 seconds)
 */
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Maximum length for response body in parse errors before truncation
 * Long response bodies are truncated to fit in boxed error format
 */
const MAX_PARSE_ERROR_BODY_LENGTH = 200;

const AUTH_401_DEFAULT_BODY = 'Unauthorized';
const AUTH_403_DEFAULT_BODY = 'Forbidden';
const API_429_DEFAULT_BODY = 'Too Many Requests';
const API_5XX_DEFAULT_BODIES = [
  'Internal Server Error',
  'Bad Gateway',
  'Service Unavailable',
  'Gateway Timeout'
] as const;

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

function formatErrorWithDetails(
  baseMessage: string,
  sanitizedBody: string,
  ignoredBodies: readonly string[]
): string {
  if (sanitizedBody && !ignoredBodies.includes(sanitizedBody)) {
    return createBoxedError(`${baseMessage} Details: ${sanitizedBody}`);
  }

  return createBoxedError(baseMessage);
}

/**
 * Format authentication error with boxed message
 * @param statusCode - HTTP status code (401, 403)
 * @param responseBody - Response body from API
 * @param authToken - Auth token to sanitize from error messages
 * @returns Formatted error with boxed message
 */
function formatAuthError(statusCode: number, responseBody: string, authToken: string): Error {
  // Sanitize response body first to prevent token exposure
  const sanitizedBody = sanitizeToken(responseBody, authToken);
  let message = '';

  if (statusCode === 401) {
    message = formatErrorWithDetails(
      'Authentication failed. Please check your credentials.',
      sanitizedBody,
      [AUTH_401_DEFAULT_BODY]
    );
  } else if (statusCode === 403) {
    message = formatErrorWithDetails(
      "Access denied. You don't have permission.",
      sanitizedBody,
      [AUTH_403_DEFAULT_BODY]
    );
  } else {
    // For other auth errors, use sanitized response body
    message = createBoxedError(sanitizedBody);
  }

  return new Error(message);
}

/**
 * Format API error with boxed message
 * @param statusCode - HTTP status code (429, 500, etc.)
 * @param responseBody - Response body from API
 * @param authToken - Auth token to sanitize from error messages
 * @returns Formatted error with boxed message
 */
function formatApiError(statusCode: number, responseBody: string, authToken: string): Error {
  // Sanitize response body first to prevent token exposure
  const sanitizedBody = sanitizeToken(responseBody, authToken);
  let message = '';

  if (statusCode === 429) {
    message = formatErrorWithDetails(
      'Too many requests. Please try again later.',
      sanitizedBody,
      [API_429_DEFAULT_BODY]
    );
  } else if (statusCode >= 500) {
    message = formatErrorWithDetails(
      'Server error. Please try again later.',
      sanitizedBody,
      API_5XX_DEFAULT_BODIES
    );
  } else {
    // For other API errors, use sanitized response body
    message = createBoxedError(sanitizedBody);
  }

  return new Error(message);
}

/**
 * Format JSON parse error with boxed message
 * @param responseBody - Response body that failed to parse
 * @param authToken - Auth token to sanitize from error messages
 * @returns Formatted error with boxed message
 */
function formatParseError(responseBody: string, authToken: string): Error {
  // Sanitize response body first to prevent token exposure
  const sanitizedBody = sanitizeToken(responseBody, authToken);
  
  // Use simple message if body is empty
  if (!sanitizedBody) {
    return new Error(createBoxedError('Invalid JSON response. The server returned malformed data.'));
  }
  
  // Truncate extremely long response bodies to fit in boxed format
  // createBoxedError will handle word wrapping across multiple lines
  const bodyToDisplay = sanitizedBody.length > MAX_PARSE_ERROR_BODY_LENGTH 
    ? `${sanitizedBody.substring(0, MAX_PARSE_ERROR_BODY_LENGTH)}...` 
    : sanitizedBody;
  
  const message = createBoxedError(`Invalid JSON response. Details: ${bodyToDisplay}`);
  return new Error(message);
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

    const port = parsedUrl.port ? Number(parsedUrl.port) : 443;
    const httpsOptions: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port,
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
          // Use appropriate error formatter based on status code
          const statusCode = res.statusCode!;
          
          if (statusCode === 401 || statusCode === 403) {
            reject(formatAuthError(statusCode, data, options.authToken));
          } else if (statusCode >= 400 && statusCode < 500) {
            // 429 and other client errors
            reject(formatApiError(statusCode, data, options.authToken));
          } else {
            // 500+ server errors
            reject(formatApiError(statusCode, data, options.authToken));
          }
          return;
        }

        try {
          const json = JSON.parse(data) as ApiResponse;
          resolve(json);
        } catch {
          // Use formatParseError for invalid JSON responses
          reject(formatParseError(data, options.authToken));
        }
      });
    });

    // Set request timeout
    req.setTimeout(REQUEST_TIMEOUT_MS);

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
export { makeRequest, queryEndpoint, formatNetworkError, createBoxedError, formatAuthError, formatApiError, formatParseError };
