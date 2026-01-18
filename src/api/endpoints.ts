/**
 * API endpoints module
 * Defines all API endpoints for ZAI and ZHIPU platforms
 */

import type { Platform } from './platforms.js';

/**
 * API endpoints configuration by platform
 */
const ENDPOINTS = {
  ZAI: {
    modelUsage: 'https://api.z.ai/api/monitor/usage/model-usage',
    toolUsage: 'https://api.z.ai/api/monitor/usage/tool-usage',
    quotaLimit: 'https://api.z.ai/api/monitor/usage/quota/limit'
  },
  ZHIPU: {
    modelUsage: 'https://open.bigmodel.cn/api/monitor/usage/model-usage',
    toolUsage: 'https://open.bigmodel.cn/api/monitor/usage/tool-usage',
    quotaLimit: 'https://open.bigmodel.cn/api/monitor/usage/quota/limit'
  },
  ZHIPU_DEV: {
    modelUsage: 'https://dev.bigmodel.cn/api/monitor/usage/model-usage',
    toolUsage: 'https://dev.bigmodel.cn/api/monitor/usage/tool-usage',
    quotaLimit: 'https://dev.bigmodel.cn/api/monitor/usage/quota/limit'
  }
} as const;

/**
 * Endpoint URLs type
 */
type Endpoints = {
  readonly modelUsage: string;
  readonly toolUsage: string;
  readonly quotaLimit: string;
};

/**
 * Get endpoints for a platform
 * @param platform - The platform type
 * @returns Endpoints configuration
 */
function getEndpoints(platform: Platform): Endpoints {
  switch (platform) {
    case 'ZAI':
      return ENDPOINTS.ZAI;
    case 'ZHIPU':
      return ENDPOINTS.ZHIPU;
    default:
      return ENDPOINTS.ZAI;
  }
}

export type { Endpoints };
export { getEndpoints };
