import { useEffect } from "react";

export function useDebouncedEffect(effect: () => void | Promise<void>, deps: unknown[], delay = 120) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void effect();
    }, delay);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
