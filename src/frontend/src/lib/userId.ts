/**
 * Formats a numeric user ID into the display format #000001
 */
export function formatSequentialUserId(userId: bigint): string {
  const idNumber = Number(userId);
  return `#${idNumber.toString().padStart(6, '0')}`;
}

/**
 * Parses a formatted user ID string (#000001) back to a number
 * Returns null if the format is invalid
 */
export function parseSequentialUserId(formattedId: string): number | null {
  const match = formattedId.match(/^#?(\d+)$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}
