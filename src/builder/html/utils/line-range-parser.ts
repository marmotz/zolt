/**
 * Parses a line range string (e.g., "1,3-5,10") into a Set of line numbers.
 */
export function parseLineRanges(rangeStr: string): Set<number> {
  const lines = new Set<number>();
  if (!rangeStr) return lines;

  const parts = rangeStr.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map((n) => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
          lines.add(i);
        }
      }
    } else {
      const line = parseInt(part.trim(), 10);
      if (!isNaN(line)) {
        lines.add(line);
      }
    }
  }

  return lines;
}
