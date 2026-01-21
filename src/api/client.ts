/**
 * HTTP client module
 * Makes HTTPS requests to Z.ai API endpoints
 */

import * as https from 'node:https';
import type { Endpoints } from './endpoints.js';

/**
 * API response type
 */
interface ApiResponse {
  data?: Record<string, unknown>;
  [key: string]: unknown;
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

    req.on('error', (error) => {
      reject(error);
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
export { makeRequest, queryEndpoint };
