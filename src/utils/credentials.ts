/**
 * Credential discovery module
 * Finds the Z.ai / Zhipu API key for the GLM Coding Plan.
 *
 * Priority order (first match wins):
 *   1. OpenCode v2 credential store (SQLite `opencode.db`, read-only probe
 *      via the `sqlite3` CLI — no native dependencies).
 *   2. OpenCode v1 `auth.json` (XDG path; legacy LOCALAPPDATA on Windows).
 *   3. Environment variables (development/testing).
 */

import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Platform } from '../api/platforms.js';
import { detectPlatform } from '../api/platforms.js';
import { getAuthFilePathCandidates } from './auth-path.js';

/** Provider ids accepted as ZAI/ZHIPU credential owners. */
export const CANDIDATE_PROVIDER_IDS = [
  'zai-coding-plan',
  'zai',
  'z-ai',
  'z.ai',
  'zhipu',
  'zhipuai'
] as const;

/** Resolved credentials plus where they came from (shown in report header). */
export interface Credentials {
  token: string;
  platform: Platform;
  source: 'opencode.db' | 'auth.json' | 'environment';
  label: string;
}

/** Timeout for the sqlite3 CLI probe. */
const SQLITE_TIMEOUT_MS = 5000;

/**
 * Extract API key from an auth entry (string or object).
 * @param entry - Auth entry value
 * @returns API key or null
 */
export function extractKeyFromEntry(entry: unknown): string | null {
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object' && entry !== null) {
    const obj = entry as Record<string, unknown>;
    for (const keyName of ['apiKey', 'api_key', 'token', 'key', 'accessToken', 'auth_token']) {
      if (typeof obj[keyName] === 'string') return obj[keyName] as string;
    }
  }
  return null;
}

interface CredentialRow {
  integration_id?: unknown;
  label?: unknown;
  value?: unknown;
}

/**
 * Resolve the OpenCode v2 data directory (XDG-compatible).
 */
function opencodeDataDir(): string {
  return process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
}

/**
 * Run a read-only query against a SQLite database via the sqlite3 CLI and
 * parse its `-json` output. Resolves [] on any failure (CLI missing, db
 * locked/missing, invalid JSON) so callers can fall through to other
 * credential sources. No native dependencies required.
 */
function querySqliteJson(dbPath: string, sql: string): Promise<CredentialRow[]> {
  return new Promise((resolve) => {
    try {
      execFile(
        'sqlite3',
        ['-readonly', '-json', dbPath, sql],
        { timeout: SQLITE_TIMEOUT_MS },
        (error: Error | null, stdout: string) => {
          if (error || !stdout) {
            resolve([]);
            return;
          }
          try {
            const parsed = JSON.parse(stdout) as unknown;
            resolve(Array.isArray(parsed) ? (parsed as CredentialRow[]) : []);
          } catch {
            resolve([]);
          }
        }
      );
    } catch {
      resolve([]);
    }
  });
}

/**
 * Read credentials from the OpenCode v2 credential store (SQLite).
 *
 * OpenCode v2 replaced auth.json with `<data>/opencode/opencode.db`; keys
 * live in the `credential` table where `value` is JSON (for example
 * {"type":"key","key":"…"}) and `integration_id` is the provider id.
 * Rows are ordered active-first, then most recently updated, so the current
 * key wins over stale or inactive copies.
 * @returns Credentials or null if not found / sqlite3 or db unavailable
 */
export async function getCredentialsFromOpenCodeDb(): Promise<Credentials | null> {
  const dbPath = path.join(opencodeDataDir(), 'opencode', 'opencode.db');
  if (!fs.existsSync(dbPath)) {
    return null;
  }

  const idList = CANDIDATE_PROVIDER_IDS.map((id) => `'${id.replace(/'/g, "''")}'`).join(',');
  const sql = `SELECT integration_id, label, value FROM credential WHERE integration_id IN (${idList}) ORDER BY active DESC, time_updated DESC`;
  const rows = await querySqliteJson(dbPath, sql);

  for (const row of rows) {
    try {
      if (typeof row.value !== 'string') continue;
      const token = extractKeyFromEntry(JSON.parse(row.value));
      const providerId = typeof row.integration_id === 'string' ? row.integration_id : '';
      if (token) {
        const platform = detectPlatform(providerId);
        if (platform) {
          return {
            token,
            platform,
            source: 'opencode.db',
            label: typeof row.label === 'string' && row.label ? row.label : providerId
          };
        }
      }
    } catch {
      // Skip malformed rows and keep probing
    }
  }
  return null;
}

/**
 * Read credentials from the OpenCode v1 auth.json.
 * Probes EVERY candidate path so a stale or partial file at one location
 * does not mask valid credentials at another.
 * @returns Credentials or null if not found
 */
export function getCredentialsFromAuthJson(): Credentials | null {
  for (const authPath of getAuthFilePathCandidates()) {
    if (!fs.existsSync(authPath)) continue;
    try {
      const content = fs.readFileSync(authPath, 'utf-8');
      const authData = JSON.parse(content) as Record<string, unknown>;

      for (const providerId of CANDIDATE_PROVIDER_IDS) {
        const entry = authData[providerId];
        if (entry) {
          const token = extractKeyFromEntry(entry);
          const platform = detectPlatform(providerId);
          if (token && platform) {
            return { token, platform, source: 'auth.json', label: providerId };
          }
        }
      }
    } catch {
      // Silent fail, try next candidate / fallback method
    }
  }
  return null;
}

/**
 * Read credentials from environment variables (development/testing).
 * @returns Credentials or null if not found
 */
export function getCredentialsFromEnv(): Credentials | null {
  const zai = process.env.ZAI_API_KEY;
  if (zai) {
    return { token: zai, platform: 'ZAI', source: 'environment', label: 'env:ZAI_API_KEY' };
  }
  const zhipu = process.env.ZHIPU_API_KEY || process.env.ZHIPUAI_API_KEY;
  if (zhipu) {
    return { token: zhipu, platform: 'ZHIPU', source: 'environment', label: 'env:ZHIPU_API_KEY' };
  }
  return null;
}

/**
 * Get credentials: opencode.db → auth.json → environment.
 * @returns Credentials or null if not found anywhere
 */
export async function getCredentials(): Promise<Credentials | null> {
  return (await getCredentialsFromOpenCodeDb()) || getCredentialsFromAuthJson() || getCredentialsFromEnv();
}
