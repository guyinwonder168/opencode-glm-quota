/**
 * Date formatter module
 * Formats dates as yyyy-MM-dd HH:mm:ss
 */

/**
 * Format date as yyyy-MM-dd HH:mm:ss
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Parse datetime string back to Date
 * @param dateTime - Formatted datetime string (yyyy-MM-dd HH:mm:ss)
 * @returns Date object
 */
export function parseDateTime(dateTime: string): Date {
  const match = dateTime.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid datetime format: ${dateTime}`);
  }
  const [, year, month, day, hours, minutes, seconds] = match;
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds)
  );
}
