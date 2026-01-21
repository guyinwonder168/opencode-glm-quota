#!/usr/bin/env node

/**
 * Usage query script for OpenCode GLM Quota Plugin.
 * Reads credentials from OpenCode's auth.json and queries usage statistics.
 * 
 * Usage:
 *   node scripts/query-usage.mjs
 * 
 * Environment Variables (fallback for development/testing):
 *   - ZAI_API_KEY (global platform)
 *   - ZHIPU_API_KEY or ZHIPUAI_API_KEY (China platform)
 */

import https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// CONSTANTS
// ============================================================================

const CANDIDATE_PROVIDER_IDS = [
  'zai-coding-plan',
  'zai',
  'z-ai',
  'z.ai',
  'zhipu',
  'zhipuai'
];

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
  }
};

// ============================================================================
// CREDENTIAL DISCOVERY
// ============================================================================

function getAuthFilePath() {
  if (process.platform === 'win32') {
    return path.join(
      process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
      'opencode',
      'auth.json'
    );
  }
  return path.join(os.homedir(), '.local', 'share', 'opencode', 'auth.json');
}

function extractKeyFromEntry(entry) {
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object' && entry !== null) {
    const obj = entry;
    for (const keyName of ['apiKey', 'api_key', 'token', 'key', 'accessToken', 'auth_token']) {
      if (typeof obj[keyName] === 'string') return obj[keyName];
    }
  }
  return null;
}

function detectPlatform(providerId) {
  const lower = providerId.toLowerCase();
  
  if (lower.includes('zhipu') || lower.includes('bigmodel')) {
    return 'ZHIPU';
  }
  
  if (lower.includes('zai') || lower === 'z.ai') {
    return 'ZAI';
  }
  
  return null;
}

function getCredentials() {
  // Priority 1: OpenCode auth.json
  const authPath = getAuthFilePath();
  if (fs.existsSync(authPath)) {
    try {
      const content = fs.readFileSync(authPath, 'utf-8');
      const authData = JSON.parse(content);
      
      for (const providerId of CANDIDATE_PROVIDER_IDS) {
        const entry = authData[providerId];
        if (entry) {
          const token = extractKeyFromEntry(entry);
          if (token) {
            const platform = detectPlatform(providerId);
            if (platform) {
              return { token, platform };
            }
          }
        }
      }
    } catch {
      // Silent fail, try next method
    }
  }

  // Priority 2: Environment variables (for development/testing)
  if (process.env.ZAI_API_KEY) {
    return { token: process.env.ZAI_API_KEY, platform: 'ZAI' };
  }
  
  if (process.env.ZHIPU_API_KEY || process.env.ZHIPUAI_API_KEY) {
    return {
      token: process.env.ZHIPU_API_KEY || process.env.ZHIPUAI_API_KEY,
      platform: 'ZHIPU'
    };
  }

  return null;
}

// ============================================================================
// API QUERY
// ============================================================================

function queryUsage(apiUrl, authToken, queryParams) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(apiUrl);
    const fullPath = queryParams 
      ? `${parsedUrl.pathname}?${queryParams}` 
      : parsedUrl.pathname;

    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: fullPath,
      method: 'GET',
      headers: {
        'Authorization': authToken,
        'Accept-Language': 'en-US,en',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
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
          const json = JSON.parse(data);
          resolve(JSON.stringify(json.data || json, null, 2));
        } catch {
          reject(new Error(`Invalid JSON: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

/**
 * Transform quota limit items to display format
 * @param {Object} quotaData - Raw quota data from API
 * @returns {Object} Transformed quota data
 */
function processQuotaData(quotaData) {
  if (!quotaData.limits || !Array.isArray(quotaData.limits)) {
    return quotaData;
  }

  quotaData.limits = quotaData.limits.map((item) => {
    if (item.type === 'TOKENS_LIMIT') {
      return {
        type: 'Token usage(5 Hour)',
        percentage: item.percentage
      };
    }
    if (item.type === 'TIME_LIMIT') {
      return {
        type: 'MCP usage(1 Month)',
        percentage: item.percentage,
        currentUsage: item.currentValue,
        total: item.usage,
        usageDetails: item.usageDetails
      };
    }
    return item;
  });

  return quotaData;
}

// ============================================================================
// MAIN
// ============================================================================

// Get credentials
const credentials = getCredentials();

if (!credentials) {
  console.error('Z.ai Credentials Not Found');
  console.error('');
  console.error('Please authenticate first:');
  console.error('');
  console.error('1. Run /connect command in OpenCode TUI');
  console.error('2. Select "Z.AI Coding Plan" or "Z.AI" (for global)');
  console.error('   Or "Zhipu" (for China region)');
  console.error('');
  console.error('For development/testing, you can also set environment variables:');
  console.error('  - export ZAI_API_KEY="your-token" (global platform)');
  console.error('  - export ZHIPU_API_KEY="your-token" (China platform)');
  process.exit(1);
}

const { token, platform } = credentials;
const endpoints = ENDPOINTS[platform];

// Time window: yesterday at current hour -> today at current hour end
const now = new Date();
const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, now.getHours(), 0, 0, 0);
const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 59, 59, 999);

// Format dates as yyyy-MM-dd HH:mm:ss
const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const startTime = formatDateTime(startDate);
const endTime = formatDateTime(endDate);
const queryParams = `startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;

console.log(`Platform: ${platform}`);
console.log(`Period: ${startTime} -> ${endTime}`);
console.log('');

async function run() {
  try {
    // Query and display model usage
    console.log('Model usage data:');
    console.log(await queryUsage(endpoints.modelUsage, token, queryParams));

    // Query and display tool usage
    console.log('Tool usage data:');
    console.log(await queryUsage(endpoints.toolUsage, token, queryParams));

    // Query and display quota limit
    console.log('Quota limit data:');
    const quotaResponse = await queryUsage(endpoints.quotaLimit, token);
    const quotaData = JSON.parse(quotaResponse);
    const processedQuotaData = processQuotaData(quotaData);
    console.log(JSON.stringify(processedQuotaData, null, 2));
  } catch (error) {
    console.error('Request failed:', error.message);
    process.exit(1);
  }
}

run();
