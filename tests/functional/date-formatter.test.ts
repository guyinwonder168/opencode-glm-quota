/**
 * Functional tests for date formatter module
 */

import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { formatDateTime, parseDateTime } from '../../src/utils/date-formatter.js';

describe('formatDateTime', () => {
  test('formats date as yyyy-MM-dd HH:mm:ss', () => {
    const date = new Date(2026, 0, 13, 14, 30, 45);
    const result = formatDateTime(date);
    assert.strictEqual(result, '2026-01-13 14:30:45');
  });

  test('pads single digit month with leading zero', () => {
    const date = new Date(2026, 0, 5, 9, 5, 5);
    const result = formatDateTime(date);
    assert.strictEqual(result, '2026-01-05 09:05:05');
  });

  test('handles end of month', () => {
    const date = new Date(2026, 11, 31, 23, 59, 59);
    const result = formatDateTime(date);
    assert.strictEqual(result, '2026-12-31 23:59:59');
  });

  test('handles start of month', () => {
    const date = new Date(2026, 0, 1, 0, 0, 0);
    const result = formatDateTime(date);
    assert.strictEqual(result, '2026-01-01 00:00:00');
  });
});

describe('parseDateTime', () => {
  test('parses valid datetime string', () => {
    const result = parseDateTime('2026-01-13 14:30:45');
    assert.strictEqual(result.getFullYear(), 2026);
    assert.strictEqual(result.getMonth(), 0); // January (0-indexed)
    assert.strictEqual(result.getDate(), 13);
    assert.strictEqual(result.getHours(), 14);
    assert.strictEqual(result.getMinutes(), 30);
    assert.strictEqual(result.getSeconds(), 45);
  });

  test('throws error for invalid format', () => {
    assert.throws(() => parseDateTime('invalid'), /Invalid datetime format/);
  });

  test('throws error for empty string', () => {
    assert.throws(() => parseDateTime(''), /Invalid datetime format/);
  });
});
