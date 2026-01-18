/**
 * Functional tests for time window module
 */

import { describe, test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { getTimeWindow, getTimeWindowQueryParams } from '../../src/utils/time-window.js';

describe('getTimeWindow', () => {
  test('returns 24-hour rolling window', () => {
    // Mock Date to 2026-01-18 14:30:00
    const mockNow = new Date(2026, 0, 18, 14, 30, 0, 0);
    
    const { startTime, endTime } = getTimeWindow(mockNow);
    
    assert.strictEqual(startTime, '2026-01-17 14:00:00');
    assert.strictEqual(endTime, '2026-01-18 14:59:59');
  });

  test('start is yesterday at same hour', () => {
    const mockNow = new Date(2026, 5, 15, 10, 0, 0, 0);
    
    const { startTime, endTime } = getTimeWindow(mockNow);
    
    assert.ok(startTime.endsWith('10:00:00'));
    assert.ok(startTime.startsWith('2026-06-14'));
  });

  test('end is today at 59:59:999', () => {
    const mockNow = new Date(2026, 5, 15, 10, 0, 0, 0);
    
    const { startTime, endTime } = getTimeWindow(mockNow);
    
    assert.ok(endTime.endsWith('10:59:59'));
    assert.ok(endTime.startsWith('2026-06-15'));
  });
});

describe('getTimeWindowQueryParams', () => {
  test('returns URL-encoded query string', () => {
    const mockNow = new Date(2026, 0, 18, 14, 30, 0, 0);
    
    const result = getTimeWindowQueryParams(mockNow);
    
    assert.ok(result.startsWith('startTime='));
    assert.ok(result.includes('&endTime='));
    assert.ok(result.includes('2026-01-17'));
    assert.ok(result.includes('2026-01-18'));
  });

  test('contains encoded spaces and colons', () => {
    const mockNow = new Date(2026, 0, 18, 14, 30, 0, 0);
    
    const result = getTimeWindowQueryParams(mockNow);
    
    // Spaces should be encoded as %20
    assert.ok(result.includes('%20'));
    // Colons should be encoded as %3A
    assert.ok(result.includes('%3A'));
  });
});
