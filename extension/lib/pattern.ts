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

/**
 * Whether an http(s) URL is covered by a urlFilter from patternToUrlFilter: the domain, its subdomains,
 * and, when the filter has a path, URLs whose path starts with it.
 */
export const urlMatchesFilter = (url: string, urlFilter: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const [host, ...pathParts] = urlFilter.slice(2).split("/");
  const hostname = parsed.hostname;
  if (!host || (hostname !== host && !hostname.endsWith(`.${host}`))) return false;
  if (pathParts.length === 0) return true;
  return parsed.pathname.startsWith(`/${pathParts.join("/")}`);
};
