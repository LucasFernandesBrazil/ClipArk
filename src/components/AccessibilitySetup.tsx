import type { useAccessibility } from "../hooks/useAccessibility";

export function AccessibilitySetup({ trusted, error, opening, refresh, request }: ReturnType<typeof useAccessibility>) {
  return (
    <div className="space-y-2 rounded-chip bg-ark-raised p-3 text-caption text-ark-textMuted">
      <p role="status" className="font-medium text-ark-text">
        {trusted === true ? "Ready for auto-paste" : trusted === false ? "Copy is ready · Auto-paste needs access" : error ? "Copy is ready · Access could not be checked" : "Checking auto-paste access…"}
      </p>
      <p>Use Copy or ⌘C to copy any clip, then ⌘V in your app. No permission needed.</p>
      {trusted !== true ? (
        <>
          <p>To let ClipArk press ⌘V for you:</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Keep ClipArk in Applications and open it from there.</li>
            <li>Open Accessibility below and enable ClipArk. If missing, use + to add it from Applications.</li>
            <li>Reopen ClipArk from the menu bar. Access is checked automatically.</li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={opening} onClick={() => void request()} className="rounded-chip bg-ark-accent px-2.5 py-1.5 font-medium text-white disabled:opacity-50">
              {opening ? "Opening…" : "Open Accessibility settings"}
            </button>
            <button type="button" onClick={() => void refresh()} className="rounded-chip bg-ark-raisedHover px-2.5 py-1.5 text-ark-text">Check again</button>
          </div>
          <details>
            <summary className="cursor-pointer">Enabled, but still not working after an update?</summary>
            <p className="mt-1">Quit ClipArk. In System Settings → Privacy & Security → Accessibility, remove the old ClipArk entry with −, then add the current app from Applications with + and enable it. Reopen ClipArk. Ad-hoc signed updates may need access again.</p>
          </details>
        </>
      ) : null}
      {error ? <p role="alert" className="text-ark-danger">{error}</p> : null}
    </div>
  );
}
