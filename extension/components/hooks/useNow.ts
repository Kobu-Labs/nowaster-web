import { useEffect, useState } from "react";

/** Re-renders every `intervalMs` with the current time (DOM-timer side effect, not server state). */
export const useNow = (intervalMs = 1000): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
};
