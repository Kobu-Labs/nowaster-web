import { useEffect } from "react";
import type { RefObject } from "react";

/** While `active`, calls `onOutside` when a pointer press lands outside `ref`. A DOM listener, not server state. */
export const useClickOutside = (ref: RefObject<HTMLElement | null>, active: boolean, onOutside: () => void) => {
  useEffect(() => {
    if (!active) return;
    const listener = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, active, onOutside]);
};
