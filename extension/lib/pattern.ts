/**
 * Convert a user-entered block pattern into a declarativeNetRequest urlFilter.
 * `example.com` becomes `||example.com` (matches the domain and its subdomains).
 * Returns null when the pattern is empty or contains characters that can't be a host/path.
 */
export const patternToUrlFilter = (pattern: string): string | null => {
  let p = pattern.trim().toLowerCase();
  if (p.startsWith("||")) p = p.slice(2);
  p = p.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  p = p.replace(/\/+$/, "");
  if (p.length === 0 || /[\s|^*]/.test(p)) return null;
  return `||${p}`;
};
