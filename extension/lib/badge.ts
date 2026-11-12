const MS_PER_MINUTE = 60_000;

/** Format elapsed time for the toolbar badge, at most 4 characters: `45m`, `1h05`, `12h`. */
export const formatBadge = (elapsedMs: number): string => {
  const minutes = Math.max(0, Math.floor(elapsedMs / MS_PER_MINUTE));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours >= 100) return "99h+";
  if (hours >= 10) return `${hours}h`;
  return `${hours}h${String(minutes % 60).padStart(2, "0")}`;
};

/** Long form for popup and focus page: `1:05:09`. */
export const formatElapsed = (elapsedMs: number): string => {
  const total = Math.max(0, Math.floor(elapsedMs / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
