/**
 * Tests for reset timer utility
 * Test formatTimeUntilReset() function following TDD
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';
import { formatTimeUntilReset } from '../../src/utils/reset-timer.js';

// ============================================================================
// TESTS FOR formatTimeUntilReset()
// ============================================================================

describe('formatTimeUntilReset', () => {
  test('should return empty string for null timestamp', () => {
    const result = formatTimeUntilReset(null);
    assert.strictEqual(result, '');
  });

  test('should return empty string for undefined timestamp', () => {
    const result = formatTimeUntilReset(undefined);
    assert.strictEqual(result, '');
  });

  test('should format 1 hour 30 minutes', () => {
    // Current time + 1.5 hours
    const resetTime = Date.now() + (90 * 60 * 1000);
    const result = formatTimeUntilReset(resetTime);
    assert.strictEqual(result, 'Resets in 1 hours 30 minutes');
  });

  test('should format 4 hours 42 minutes', () => {
    // Current time + 4h 42m
    const resetTime = Date.now() + (4 * 60 * 60 * 1000) + (42 * 60 * 1000);
    const result = formatTimeUntilReset(resetTime);
    assert.strictEqual(result, 'Resets in 4 hours 42 minutes');
  });

  test('should format only hours when minutes is 0', () => {
    // Current time + 5 hours
    const resetTime = Date.now() + (5 * 60 * 60 * 1000);
    const result = formatTimeUntilReset(resetTime);
    assert.strictEqual(result, 'Resets in 5 hours 0 minutes');
  });

  test('should format only minutes when hours is 0', () => {
    // Current time + 45 minutes
    const resetTime = Date.now() + (45 * 60 * 1000);
    const result = formatTimeUntilReset(resetTime);
    assert.strictEqual(result, 'Resets in 0 hours 45 minutes');
  });

  test('should return empty string for past timestamp', () => {
    // Current time - 1 hour (already passed)
    const resetTime = Date.now() - (60 * 60 * 1000);
    const result = formatTimeUntilReset(resetTime);
    assert.strictEqual(result, '');
  });

  test('should return empty string for invalid timestamp', () => {
    const result = formatTimeUntilReset(-1);
    assert.strictEqual(result, '');
  });

  test('should return empty string for non-numeric timestamp', () => {
    const result = formatTimeUntilReset('invalid' as unknown as number);
    assert.strictEqual(result, '');
  });
});
