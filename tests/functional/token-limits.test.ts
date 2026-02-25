import { describe, test } from 'node:test';
import assert from 'node:assert';

import {
  FIVE_HOUR_TOKEN_LIMIT_LABEL,
  WEEKLY_TOKEN_LIMIT_LABEL,
  getTokenLimitLabel,
  isFiveHourTokenLimit
} from '../../src/utils/token-limits.js';

describe('token limit labeling', () => {
  test('maps 5-hour token limit using unit and number', () => {
    const label = getTokenLimitLabel({
      type: 'TOKENS_LIMIT',
      unit: 3,
      number: 5
    });

    assert.strictEqual(label, FIVE_HOUR_TOKEN_LIMIT_LABEL);
  });

  test('maps weekly token limit using unit and number', () => {
    const label = getTokenLimitLabel({
      type: 'TOKENS_LIMIT',
      unit: 6,
      number: 1
    });

    assert.strictEqual(label, WEEKLY_TOKEN_LIMIT_LABEL);
  });

  test('falls back to explicit unit/number label for unknown token windows', () => {
    const label = getTokenLimitLabel({
      type: 'TOKENS_LIMIT',
      unit: 8,
      number: 2
    });

    assert.strictEqual(label, 'Token usage(unit=8, number=2)');
  });
});

describe('5-hour token limit selection', () => {
  test('recognizes 5-hour token window from raw fields', () => {
    const isFiveHour = isFiveHourTokenLimit({
      rawType: 'TOKENS_LIMIT',
      unit: 3,
      number: 5
    });

    assert.strictEqual(isFiveHour, true);
  });

  test('does not classify weekly token window as 5-hour', () => {
    const isFiveHour = isFiveHourTokenLimit({
      rawType: 'TOKENS_LIMIT',
      unit: 6,
      number: 1
    });

    assert.strictEqual(isFiveHour, false);
  });

  test('keeps backward compatibility for legacy processed data label', () => {
    const isFiveHour = isFiveHourTokenLimit({
      type: FIVE_HOUR_TOKEN_LIMIT_LABEL
    });

    assert.strictEqual(isFiveHour, true);
  });
});
