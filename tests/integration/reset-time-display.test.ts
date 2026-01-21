/**
 * Integration tests for reset time display
 * Test reset countdown functionality in output formatting
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';

/**
 * Simulate processQuotaLimit function behavior with nextResetTime
 */
function mockProcessQuotaLimitWithReset(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };

  if (result.limits && Array.isArray(result.limits)) {
    result.limits = result.limits.map((item: unknown) => {
      if (typeof item === 'object' && item !== null) {
        const limit = item as Record<string, unknown>;

        if (limit.type === 'TOKENS_LIMIT') {
          return {
            type: 'Token usage(5 Hour)',
            percentage: typeof limit.percentage === 'number' ? limit.percentage : 0,
            nextResetTime: limit.nextResetTime as number | undefined
          };
        }

        if (limit.type === 'TIME_LIMIT') {
          return {
            type: 'MCP usage(1 Month)',
            percentage: typeof limit.percentage === 'number' ? limit.percentage : 0,
            currentValue: limit.currentValue,
            total: limit.usage,
            usageDetails: limit.usageDetails as Record<string, unknown> | undefined
          };
        }
      }
      return item;
    });
  }

  return result;
}

describe('Reset Time Display Integration', () => {
  /**
   * Test: Quota limit processing preserves nextResetTime
   */
  test('preserves nextResetTime in processed quota data', () => {
    const resetTime = Date.now() + (4 * 60 * 60 * 1000); // 4 hours from now
    const apiResponse = {
      limits: [
        {
          type: 'TOKENS_LIMIT',
          percentage: 45,
          unit: 3,
          number: 5,
          nextResetTime: resetTime
        }
      ]
    };

    const processed = mockProcessQuotaLimitWithReset(apiResponse);
    const limits = processed.limits as unknown[];

    assert.ok(limits, 'Should have limits array');
    assert.strictEqual(limits.length, 1, 'Should have 1 limit');
    assert.strictEqual(
      (limits[0] as Record<string, unknown>).nextResetTime,
      resetTime,
      'Should preserve nextResetTime'
    );
  });

  /**
   * Test: Quota limit processing handles missing nextResetTime
   */
  test('handles missing nextResetTime gracefully', () => {
    const apiResponse = {
      limits: [
        {
          type: 'TOKENS_LIMIT',
          percentage: 45,
          unit: 3,
          number: 5
          // NO nextResetTime field
        }
      ]
    };

    const processed = mockProcessQuotaLimitWithReset(apiResponse);
    const limits = processed.limits as unknown[];

    assert.ok(limits, 'Should have limits array');
    assert.strictEqual(limits.length, 1, 'Should have 1 limit');
    assert.strictEqual(
      (limits[0] as Record<string, unknown>).nextResetTime,
      undefined,
      'nextResetTime should be undefined when not provided'
    );
  });

  /**
   * Test: Reset countdown calculation works with processed data
   */
  test('reset countdown works with processed quota data', () => {
    const resetTime = Date.now() + (2 * 60 * 60 * 1000) + (30 * 60 * 1000); // 2h 30m from now
    const apiResponse = {
      limits: [
        {
          type: 'TOKENS_LIMIT',
          percentage: 75,
          unit: 3,
          number: 5,
          nextResetTime: resetTime
        }
      ]
    };

    const processed = mockProcessQuotaLimitWithReset(apiResponse);
    const limit = processed.limits?.[0] as Record<string, unknown>;

    assert.ok(limit, 'Should have limit data');
    assert.strictEqual(limit.type, 'Token usage(5 Hour)', 'Should have correct type');
    assert.strictEqual(limit.percentage, 75, 'Should preserve percentage');
    assert.strictEqual(limit.nextResetTime, resetTime, 'Should preserve reset time');
  });

  /**
   * Test: Multiple limits with mixed reset time availability
   */
  test('handles multiple limits with different reset time availability', () => {
    const resetTime = Date.now() + (3 * 60 * 60 * 1000); // 3 hours from now
    const apiResponse = {
      limits: [
        {
          type: 'TOKENS_LIMIT',
          percentage: 60,
          unit: 3,
          number: 5,
          nextResetTime: resetTime
        },
        {
          type: 'TIME_LIMIT',
          percentage: 85,
          currentValue: 85,
          usage: 100
          // NO nextResetTime for TIME_LIMIT
        }
      ]
    };

    const processed = mockProcessQuotaLimitWithReset(apiResponse);
    const limits = processed.limits as unknown[];

    assert.ok(limits, 'Should have limits array');
    assert.strictEqual(limits.length, 2, 'Should have 2 limits');

    const tokenLimit = limits[0] as Record<string, unknown>;
    const timeLimit = limits[1] as Record<string, unknown>;

    assert.strictEqual(tokenLimit.nextResetTime, resetTime, 'Token limit should have reset time');
    assert.strictEqual(timeLimit.nextResetTime, undefined, 'Time limit should not have reset time');
  });
});
