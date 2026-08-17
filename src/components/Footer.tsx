type FooterProps = {
  count: number;
  /** When false, Enter copies and closes instead of pasting into the previous app. */
  autoPaste: boolean;
  trackingPaused: boolean;
  /** The settings view has no selection, so clip shortcuts are not offered there. */
  showingSettings: boolean;
};

const hints: Array<[string, string]> = [
  ["← →", "Navigate"],
  ["⌘1-9", "Quick paste"],
  ["⌘C", "Copy"],
  ["⌘D", "Favorite"],
  ["esc", "Close"],
];

export function Footer({ count, autoPaste, trackingPaused, showingSettings }: FooterProps) {
  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-ark-hairline px-3 text-caption text-ark-textFaint">
      <span className="shrink-0 tabular-nums">
        {showingSettings ? "Settings" : `${count} ${count === 1 ? "clip" : "clips"}`}
      </span>
      {trackingPaused && !showingSettings ? (
        <span className="shrink-0 rounded bg-ark-dangerSoft px-1.5 py-px font-medium text-ark-danger">Paused</span>
      ) : null}

      <div className="ml-auto flex min-w-0 items-center gap-3 overflow-hidden">
        {showingSettings ? (
          <Hint keys="esc" label="Back to clips" />
        ) : (
          <>
            <Hint keys="⏎" label={autoPaste ? "Paste" : "Copy & close"} />
            {hints.map(([keys, label]) => (
              <Hint key={keys} keys={keys} label={label} />
            ))}
          </>
        )}
      </div>
    </footer>
  );
}

function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      <kbd className="rounded bg-ark-raised px-1 py-px font-sans text-caption text-ark-textMuted">{keys}</kbd>
      <span>{label}</span>
    </span>
  );
}
