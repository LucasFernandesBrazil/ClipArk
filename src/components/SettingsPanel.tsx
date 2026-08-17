import { PauseCircle, PlayCircle, RotateCcw, Trash2 } from "lucide-react";
import type { AppSettings } from "../types";

type SettingsPanelProps = {
  settings: AppSettings | null;
  onSave: (settings: AppSettings) => Promise<void>;
  onTrackingPaused: (paused: boolean) => Promise<void>;
  onClearHistory: () => void;
  onSeed: () => Promise<void>;
};

const limits = [
  { label: "500", value: 500 },
  { label: "1,000", value: 1000 },
  { label: "5,000", value: 5000 },
  { label: "10,000", value: 10000 },
  { label: "Unlimited", value: null },
];

export function SettingsPanel({ settings, onSave, onTrackingPaused, onClearHistory, onSeed }: SettingsPanelProps) {
  const active = settings ?? { launchAtStartup: false, maxStoredClips: 5000, trackingPaused: false };

  return (
    <section className="h-full overflow-y-auto px-8 py-7 clip-scrollbar">
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold text-ark-text">Settings</h2>
        <p className="mt-1 text-sm text-ark-muted">Local-only preferences for ClipArk.</p>

        <div className="mt-8 space-y-8">
          <Group title="General">
            <label className="flex items-center justify-between rounded-md border border-ark-border bg-ark-panelSoft px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-ark-text">Launch ClipArk at startup</span>
                <span className="block text-xs text-ark-muted">Disabled by default.</span>
              </span>
              <input
                type="checkbox"
                className="rounded border-ark-border bg-ark-panel text-ark-accent focus:ring-ark-accent"
                checked={active.launchAtStartup}
                onChange={(event) => void onSave({ ...active, launchAtStartup: event.currentTarget.checked })}
              />
            </label>
          </Group>

          <Group title="History">
            <label className="block text-sm text-ark-text" htmlFor="max-clips">
              Maximum stored clips
            </label>
            <select
              id="max-clips"
              className="mt-2 w-56 rounded-md border-ark-border bg-ark-panel text-sm text-ark-text shadow-none focus:border-ark-accent focus:ring-ark-accent"
              value={active.maxStoredClips ?? "unlimited"}
              onChange={(event) => {
                const value = event.currentTarget.value === "unlimited" ? null : Number(event.currentTarget.value);
                void onSave({ ...active, maxStoredClips: value });
              }}
            >
              {limits.map((limit) => (
                <option key={limit.label} value={limit.value ?? "unlimited"}>
                  {limit.label}
                </option>
              ))}
            </select>
          </Group>

          <Group title="Privacy">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-ark-border bg-ark-panelSoft px-4 py-2 text-sm text-ark-text transition hover:bg-white/5"
                onClick={() => void onTrackingPaused(!active.trackingPaused)}
              >
                {active.trackingPaused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                {active.trackingPaused ? "Resume clipboard tracking" : "Pause clipboard tracking"}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/15"
                onClick={onClearHistory}
              >
                <Trash2 className="h-4 w-4" />
                Clear clipboard history
              </button>
            </div>
          </Group>

          {import.meta.env.DEV ? (
            <Group title="Development">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-ark-border bg-ark-panelSoft px-4 py-2 text-sm text-ark-text transition hover:bg-white/5"
                onClick={() => void onSeed()}
              >
                <RotateCcw className="h-4 w-4" />
                Seed sample clips
              </button>
            </Group>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ark-muted">{title}</h3>
      {children}
    </section>
  );
}
