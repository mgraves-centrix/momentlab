/**
 * Formats a media timestamp in milliseconds to standard mm:ss timecode string.
 * e.g., 65000 -> "01:05", 37000 -> "00:37", 125000 -> "02:05"
 */
export function formatTimecodeMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Formats a media duration in seconds to standard mm:ss timecode string.
 * e.g., 65 -> "01:05", 37 -> "00:37", 125 -> "02:05"
 */
export function formatTimecodeSec(sec: number): string {
  const totalSeconds = Math.max(0, Math.floor(sec || 0));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Returns singular or plural form based on count n.
 * e.g., 1, "cut" -> "cut"; 2, "cut" -> "cuts"
 * e.g., 1, "PROJECT" -> "PROJECT"; 2, "PROJECT" -> "PROJECTS"
 */
export const plural = (n: number, singular: string, pluralForm?: string) =>
  n === 1 ? singular : (pluralForm ?? (singular === singular.toUpperCase() ? singular + 'S' : singular + 's'));

