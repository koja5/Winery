/**
 * Formats a Date as "YYYY-MM-DD" using its LOCAL calendar day — never use
 * `date.toISOString().slice(0, 10)` for this: it converts to UTC first and
 * silently rolls the day back (or forward) whenever the local timezone
 * offset pushes midnight across a UTC day boundary.
 */
export function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
