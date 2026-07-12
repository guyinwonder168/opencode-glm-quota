/**
 * Auth file path resolution module
 * Resolves the location of OpenCode's auth.json across platforms.
 *
 * OpenCode stores auth.json at the XDG-compatible path
 * `~/.local/share/opencode/auth.json` CROSS-PLATFORM (including Windows).
 * On Windows the XDG path is the source of truth and is tried FIRST; the
 * legacy `%LOCALAPPDATA%\opencode\auth.json` is only a fallback for old or
 * workaround-created copies, so a stale legacy token can never mask the
 * current XDG credentials. The XDG candidate MUST be present on every
 * platform or authenticated Windows users appear logged out
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
 *   [0] XDG path (always):        `<homedir>/.local/share/opencode/auth.json`
 *   [1] legacy LOCALAPPDATA path: `<localAppData>/opencode/auth.json`
 *
 * The XDG path is the real, current OpenCode auth location and is tried first
 * so a stale legacy copy cannot shadow it. On every other platform the XDG
 * path is returned alone. The XDG candidate is ALWAYS present, including on
 * win32 — this is the cross-platform fix.
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
    return [xdgPath, legacyPath];
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
