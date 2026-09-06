import { useCallback, useEffect, useState } from "react";
import { accessibilityStatus, requestAccessibility } from "../lib/tauri";

/** Recheck after System Settings changes, including while the launcher is hidden. */
export function useAccessibility() {
  const [trusted, setTrusted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const granted = await accessibilityStatus();
      setTrusted(granted);
      if (granted) setRequestError(null);
      setError(null);
    } catch {
      setTrusted(null);
      setError("Could not check access. You can still copy clips. Try checking again.");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const request = async () => {
    setOpening(true);
    try {
      setTrusted(await requestAccessibility());
      setRequestError(null);
    } catch {
      setRequestError("Open System Settings → Privacy & Security → Accessibility manually.");
    } finally {
      setOpening(false);
    }
  };

  return { trusted, error: requestError ?? error, opening, refresh, request };
}
