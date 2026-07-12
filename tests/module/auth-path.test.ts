/**
 * Module tests for auth file path resolution
 * Regression coverage for issues #39 + #41:
 *   On Windows the XDG path (~/.local/share/opencode/auth.json) MUST be a
 *   candidate, because opencode stores auth.json there cross-platform.
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import {
  getAuthFilePathCandidates,
  resolveAuthFilePath
} from '../../src/utils/auth-path.js';

/**
 * Normalize a path to posix separators so assertions are stable regardless of
 * the host OS the test runner executes on (path.join uses host separators).
 */
function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

describe('getAuthFilePathCandidates', () => {
  test('win32 returns exactly 2 candidates with XDG first and legacy second', () => {
    const candidates = getAuthFilePathCandidates({
      homedir: 'C:\\users\\me',
      platform: 'win32',
      localAppData: 'C:\\users\\me\\AppData\\Local'
    });

    assert.strictEqual(candidates.length, 2);
    assert.ok(
      toPosix(candidates[0]).endsWith('.local/share/opencode/auth.json'),
      `XDG candidate [0] should end with .local/share/opencode/auth.json, got: ${candidates[0]}`
    );
    assert.ok(
      toPosix(candidates[1]).endsWith('AppData/Local/opencode/auth.json'),
      `legacy candidate [1] should end with AppData/Local/opencode/auth.json, got: ${candidates[1]}`
    );
  });

  test('win32 includes the XDG candidate (core regression for #39/#41)', () => {
    const candidates = getAuthFilePathCandidates({
      homedir: 'C:\\users\\me',
      platform: 'win32',
      localAppData: 'C:\\users\\me\\AppData\\Local'
    });

    const hasXdg = candidates.some((c) => toPosix(c).endsWith('.local/share/opencode/auth.json'));
    assert.ok(hasXdg, 'XDG candidate must be present on win32');
  });

  test('win32 falls back to homedir/AppData/Local when LOCALAPPDATA is unset', () => {
    const saved = process.env.LOCALAPPDATA;
    delete process.env.LOCALAPPDATA;
    try {
      const candidates = getAuthFilePathCandidates({
        homedir: 'C:\\users\\me',
        platform: 'win32'
      });

      assert.strictEqual(candidates.length, 2);
      assert.ok(
        toPosix(candidates[1]).endsWith('AppData/Local/opencode/auth.json'),
        `legacy fallback candidate [1] should end with AppData/Local/opencode/auth.json, got: ${candidates[1]}`
      );
    } finally {
      if (saved !== undefined) process.env.LOCALAPPDATA = saved;
    }
  });

  test('darwin returns exactly 1 candidate (XDG only)', () => {
    const candidates = getAuthFilePathCandidates({
      homedir: '/Users/me',
      platform: 'darwin'
    });

    assert.strictEqual(candidates.length, 1);
    assert.ok(
      toPosix(candidates[0]).endsWith('.local/share/opencode/auth.json'),
      `darwin candidate should end with .local/share/opencode/auth.json, got: ${candidates[0]}`
    );
  });

  test('linux returns exactly 1 candidate (XDG only)', () => {
    const candidates = getAuthFilePathCandidates({
      homedir: '/home/me',
      platform: 'linux'
    });

    assert.strictEqual(candidates.length, 1);
    assert.ok(
      toPosix(candidates[0]).endsWith('.local/share/opencode/auth.json'),
      `linux candidate should end with .local/share/opencode/auth.json, got: ${candidates[0]}`
    );
  });
});

describe('resolveAuthFilePath', () => {
  test('returns candidates[0] when no candidate exists', () => {
    const tmp = mkdtempSync(path.join(tmpdir(), 'auth-path-none-'));
    try {
      const resolved = resolveAuthFilePath({ homedir: tmp, platform: 'linux' });
      const expected = path.join(tmp, '.local', 'share', 'opencode', 'auth.json');
      assert.strictEqual(resolved, expected);
      assert.strictEqual(existsSync(resolved), false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('returns candidates[0] (XDG) on win32 when NEITHER candidate exists', () => {
    const tmp = mkdtempSync(path.join(tmpdir(), 'auth-path-none-win-'));
    try {
      const localAppData = path.join(tmp, 'AppData', 'Local');
      const resolved = resolveAuthFilePath({ homedir: tmp, platform: 'win32', localAppData });
      const expectedXdg = path.join(tmp, '.local', 'share', 'opencode', 'auth.json');
      assert.strictEqual(resolved, expectedXdg);
      assert.strictEqual(existsSync(resolved), false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('returns the first existing candidate on non-win', () => {
    const tmp = mkdtempSync(path.join(tmpdir(), 'auth-path-xdg-'));
    try {
      const xdgDir = path.join(tmp, '.local', 'share', 'opencode');
      mkdirSync(xdgDir, { recursive: true });
      const xdgFile = path.join(xdgDir, 'auth.json');
      writeFileSync(xdgFile, '{}');

      const resolved = resolveAuthFilePath({ homedir: tmp, platform: 'linux' });
      assert.strictEqual(resolved, xdgFile);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('prefers XDG path on win32 when both candidates exist (stale legacy must not shadow)', () => {
    const tmp = mkdtempSync(path.join(tmpdir(), 'auth-path-both-'));
    try {
      const localAppData = path.join(tmp, 'AppData', 'Local');
      const legacyDir = path.join(localAppData, 'opencode');
      const xdgDir = path.join(tmp, '.local', 'share', 'opencode');
      mkdirSync(legacyDir, { recursive: true });
      mkdirSync(xdgDir, { recursive: true });
      writeFileSync(path.join(legacyDir, 'auth.json'), '{}');
      writeFileSync(path.join(xdgDir, 'auth.json'), '{}');

      const resolved = resolveAuthFilePath({ homedir: tmp, platform: 'win32', localAppData });
      assert.strictEqual(resolved, path.join(xdgDir, 'auth.json'));
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('returns XDG path on win32 when only XDG exists (the #39/#41 regression)', () => {
    const tmp = mkdtempSync(path.join(tmpdir(), 'auth-path-xdg-win-'));
    try {
      const localAppData = path.join(tmp, 'AppData', 'Local');
      const xdgDir = path.join(tmp, '.local', 'share', 'opencode');
      mkdirSync(xdgDir, { recursive: true });
      writeFileSync(path.join(xdgDir, 'auth.json'), '{}');

      const resolved = resolveAuthFilePath({ homedir: tmp, platform: 'win32', localAppData });
      assert.strictEqual(resolved, path.join(xdgDir, 'auth.json'));
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
