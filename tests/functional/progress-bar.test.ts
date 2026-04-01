/**
 * Functional tests for progress bar module (v1.7.0 Markdown format)
 * 
 * Progress bars use Unicode █░ characters, fixed 12-char width,
 * rendered in Markdown code spans for OpenCode's Glamour TUI.
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';
import { createProgressBar, formatPercentage, formatProgressLine } from '../../src/utils/progress-bar.js';

describe('createProgressBar', () => {
  test('creates full bar at 100%', () => {
    const result = createProgressBar(100);
    assert.strictEqual(result, '████████████');
    assert.strictEqual(result.length, 12);
  });

  test('creates empty bar at 0%', () => {
    const result = createProgressBar(0);
    assert.strictEqual(result, '░░░░░░░░░░░░');
    assert.strictEqual(result.length, 12);
  });

  test('creates half-filled bar at 50%', () => {
    const result = createProgressBar(50);
    assert.strictEqual(result, '██████░░░░░░');
  });

  test('creates 40% bar', () => {
    const result = createProgressBar(40);
    // 40% of 12 = 4.8, rounds to 5
    assert.strictEqual(result, '█████░░░░░░░');
  });

  test('clamps percentage to 100', () => {
    const result = createProgressBar(150);
    assert.strictEqual(result, '████████████');
  });

  test('clamps percentage to 0', () => {
    const result = createProgressBar(-50);
    assert.strictEqual(result, '░░░░░░░░░░░░');
  });

  test('handles small percentage', () => {
    const result = createProgressBar(1);
    // 1% of 12 = 0.12, rounds to 0
    assert.strictEqual(result, '░░░░░░░░░░░░');
  });

  test('handles 99.9% (rounds to full)', () => {
    const result = createProgressBar(99.9);
    // 99.9% of 12 = 11.988, rounds to 12
    assert.strictEqual(result, '████████████');
  });

  test('always returns exactly 12 characters', () => {
    for (const pct of [0, 1, 25, 33, 50, 66, 75, 99, 100]) {
      assert.strictEqual(createProgressBar(pct).length, 12);
    }
  });

  test('only contains █ and ░ characters', () => {
    for (const pct of [0, 25, 50, 75, 100]) {
      const result = createProgressBar(pct);
      assert.ok(/^^[█░]+$/.test(result), `Invalid chars in bar for ${pct}%: ${result}`);
    }
  });
});

describe('formatPercentage', () => {
  test('formats with one decimal', () => {
    assert.strictEqual(formatPercentage(40.5), '40.5%');
  });

  test('formats whole number', () => {
    assert.strictEqual(formatPercentage(100), '100.0%');
  });

  test('formats zero', () => {
    assert.strictEqual(formatPercentage(0), '0.0%');
  });

  test('formats with custom decimals', () => {
    assert.strictEqual(formatPercentage(33.333, 2), '33.33%');
  });
});

describe('formatProgressLine', () => {
  test('returns progress bar in code span', () => {
    const result = formatProgressLine('Test Label', 75);
    assert.strictEqual(result, '`█████████░░░`');
  });

  test('returns code span for empty bar', () => {
    const result = formatProgressLine('Test', 0);
    assert.strictEqual(result, '`░░░░░░░░░░░░`');
  });

  test('returns code span for full bar', () => {
    const result = formatProgressLine('Test', 100);
    assert.strictEqual(result, '`████████████`');
  });

  test('wraps createProgressBar output in backticks', () => {
    const bar = createProgressBar(50);
    const line = formatProgressLine('Any', 50);
    assert.strictEqual(line, '`' + bar + '`');
  });
});
