/**
 * Reset timer utility module
 * Formats Unix timestamps to human-readable countdown strings
 */

/**
 * Format time until reset as:
 * - "X hours Y minutes" for durations under 24 hours
 * - "X days and Y hours" for durations of 24 hours or longer
 * @param resetTime - Unix timestamp in milliseconds (from API's nextResetTime field)
 * @returns Human-readable countdown string or empty string if invalid/past
 */
export function formatTimeUntilReset(resetTime: number | null | undefined): string {
  // Validate input
  if (resetTime === null || resetTime === undefined) {
    return '';
  }

  // Check if valid number
  if (typeof resetTime !== 'number' || Number.isNaN(resetTime) || resetTime < 0) {
    return '';
  }

  // Calculate time difference
  const now = Date.now();
  const diffMs = resetTime - now;

  // Return empty for past timestamps
  if (diffMs <= 0) {
    return '';
  }

  // Convert to hours and minutes
  const totalMinutes = Math.floor(diffMs / (1000 * 60));

  // Show longer durations as days + hours for readability
  if (totalMinutes >= 24 * 60) {
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;
    const dayUnit = days === 1 ? 'day' : 'days';
    const hourUnit = remainingHours === 1 ? 'hour' : 'hours';

    return `Resets in ${days} ${dayUnit} and ${remainingHours} ${hourUnit}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `Resets in ${hours} hours ${minutes} minutes`;
}
