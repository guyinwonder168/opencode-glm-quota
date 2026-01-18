/**
 * Time window module
 * Calculates 24-hour rolling window for usage queries
 */

import { formatDateTime } from './date-formatter.js';

/**
 * Time window result
 */
export interface TimeWindow {
  startTime: string;
  endTime: string;
}

/**
 * Get 24-hour rolling time window
 * From yesterday at current hour to today at current hour end
 * 
 * Example: If now is 2026-01-18 14:30:00
 * - startTime: 2026-01-17 14:00:00
 * - endTime: 2026-01-18 14:59:59.999
 * 
 * @param now - Current date (defaults to now)
 * @returns Time window with formatted start and end times
 */
export function getTimeWindow(now: Date = new Date()): TimeWindow {
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    now.getHours(),
    0,
    0,
    0
  );
  
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    59,
    59,
    999
  );
  
  return {
    startTime: formatDateTime(startDate),
    endTime: formatDateTime(endDate)
  };
}

/**
 * Create query parameters for time window
 * @param now - Current date (defaults to now)
 * @returns URL-encoded query string
 */
export function getTimeWindowQueryParams(now: Date = new Date()): string {
  const { startTime, endTime } = getTimeWindow(now);
  return `startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
}
