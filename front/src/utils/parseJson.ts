export function parseJsonSafe(str: string): string {
  if (!str) return '';
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed[0] : String(parsed);
  } catch {
    return str;
  }
}
