const TOKEN_LIMIT_TYPE = 'TOKENS_LIMIT';

export const FIVE_HOUR_TOKEN_LIMIT_LABEL = 'Token usage(5 Hour)';
export const WEEKLY_TOKEN_LIMIT_LABEL = 'Token usage(Weekly)';

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return null;
}

export function getTokenLimitLabel(limit: { type?: unknown; unit?: unknown; number?: unknown }): string {
  if (limit.type !== TOKEN_LIMIT_TYPE) {
    return String(limit.type || 'Unknown');
  }

  const unit = asFiniteNumber(limit.unit);
  const number = asFiniteNumber(limit.number);

  if (unit === 3 && number === 5) {
    return FIVE_HOUR_TOKEN_LIMIT_LABEL;
  }

  if (unit === 6 && number === 1) {
    return WEEKLY_TOKEN_LIMIT_LABEL;
  }

  if (unit !== null && number !== null) {
    return `Token usage(unit=${unit}, number=${number})`;
  }

  return 'Token usage';
}

export function isFiveHourTokenLimit(limit: {
  type?: unknown;
  rawType?: unknown;
  unit?: unknown;
  number?: unknown;
}): boolean {
  const unit = asFiniteNumber(limit.unit);
  const number = asFiniteNumber(limit.number);
  const rawType = limit.rawType;

  if (rawType === TOKEN_LIMIT_TYPE && unit === 3 && number === 5) {
    return true;
  }

  return limit.type === FIVE_HOUR_TOKEN_LIMIT_LABEL;
}
