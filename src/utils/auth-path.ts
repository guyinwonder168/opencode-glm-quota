/**
 * Auth file path resolution module
 * Resolves the location of OpenCode's auth.json across platforms.
 *
 * OpenCode stores auth.json at the XDG-compatible path
 * `~/.local/share/opencode/auth.json` CROSS-PLATFORM (including Windows).
 * On Windows we additionally probe the legacy `%LOCALAPPDATA%\opencode\auth.json`
 * location first, then fall through to the XDG path. The XDG candidate MUST be
 * present on every platform or authenticated Windows users appear logged out
 * (regression: issues #39 / #41).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Options for auth file path resolution. All fields optional; each falls back
 * to the corresponding process/global default.
 */
export interface AuthFilePathOptions {
  /** Home directory. Defaults to os.homedir(). */
  homedir?: string;
  /** Platform to resolve for. Defaults to process.platform. */
  platform?: NodeJS.Platform;
  /** Windows LOCALAPPDATA directory. Defaults to process.env.LOCALAPPDATA, falling back to <homedir>/AppData/Local when unset or empty. */
  localAppData?: string;
}

/**
 * Get ordered candidate paths for OpenCode's auth.json.
 *
 * On win32 returns two candidates in priority order:
 *   [0] legacy LOCALAPPDATA path: `<localAppData>/opencode/auth.json`
 *   [1] XDG path (always):        `<homedir>/.local/share/opencode/auth.json`
 *
 * On every other platform returns the XDG path only. The XDG candidate is
 * ALWAYS present, including on win32 — this is the cross-platform fix.
 *
 * @param opts - Optional overrides for homedir/platform/localAppData (testing).
 * @returns Ordered list of candidate auth.json paths.
 */
export function getAuthFilePathCandidates(opts?: AuthFilePathOptions): string[] {
  const homedir = opts?.homedir ?? os.homedir();
  const platform = opts?.platform ?? process.platform;

  const xdgPath = path.join(homedir, '.local', 'share', 'opencode', 'auth.json');

  if (platform === 'win32') {
    const localAppData =
      opts?.localAppData ||
      process.env.LOCALAPPDATA ||
      path.join(homedir, 'AppData', 'Local');
    const legacyPath = path.join(localAppData, 'opencode', 'auth.json');
    return [legacyPath, xdgPath];
  }

  return [xdgPath];
}

/**
 * Resolve the auth.json path to use, returning the first existing candidate.
 *
 * Probes each candidate returned by {@link getAuthFilePathCandidates} with
 * fs.existsSync(); returns the first match. If none exist, returns
 * candidates[0] so callers can still surface a sensible path.
 *
 * @param opts - Optional overrides for homedir/platform/localAppData (testing).
 * @returns The resolved auth.json path.
 */
export function resolveAuthFilePath(opts?: AuthFilePathOptions): string {
  const candidates = getAuthFilePathCandidates(opts);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}
