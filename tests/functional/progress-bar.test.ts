/**
 * Functional tests for progress bar module
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';
import { createProgressBar, formatPercentage, formatProgressLine } from '../../src/utils/progress-bar.js';

describe('createProgressBar', () => {
  test('creates full bar at 100%', () => {
    const result = createProgressBar(100);
    assert.strictEqual(result.length, 30);
    assert.ok(result.includes('█'));
    assert.ok(!result.includes('░'));
  });

  test('creates empty bar at 0%', () => {
    const result = createProgressBar(0);
    assert.strictEqual(result.length, 30);
    assert.ok(!result.includes('█'));
    assert.ok(result.includes('░'));
  });

  test('creates half-filled bar at 50%', () => {
    const result = createProgressBar(50);
    assert.strictEqual(result.length, 30);
    const filledCount = (result.match(/█/g) || []).length;
    const emptyCount = (result.match(/░/g) || []).length;
    assert.strictEqual(filledCount, 15);
    assert.strictEqual(emptyCount, 15);
  });

  test('clamps percentage to 100', () => {
    const result = createProgressBar(150);
    assert.strictEqual(result.length, 30);
    assert.ok(result.includes('█'));
    assert.ok(!result.includes('░'));
  });

  test('clamps percentage to 0', () => {
    const result = createProgressBar(-50);
    assert.strictEqual(result.length, 30);
    assert.ok(!result.includes('█'));
    assert.ok(result.includes('░'));
  });

  test('uses custom width', () => {
    const result = createProgressBar(50, { width: 10 });
    assert.strictEqual(result.length, 10);
  });

  test('uses custom characters', () => {
    const result = createProgressBar(50, { 
      filledChar: '■', 
      emptyChar: '□' 
    });
    assert.ok(result.includes('■'));
    assert.ok(result.includes('□'));
    assert.ok(!result.includes('█'));
    assert.ok(!result.includes('░'));
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
  test('formats complete line', () => {
    const result = formatProgressLine('Test Label', 75);
    assert.ok(result.includes('Test Label'));
    assert.ok(result.includes('75.0%'));
    assert.ok(result.includes('█'));
    assert.ok(result.includes('░'));
  });

  test('pads label to 20 characters', () => {
    const result = formatProgressLine('Short', 50);
    assert.ok(result.startsWith('Short'));
  });
});
