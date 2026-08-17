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
    <section className="h-full overflow-y-auto px-1 py-7 clip-scrollbar">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="mt-1 text-sm font-medium text-white/42">Local-only preferences for ClipArk.</p>

        <div className="mt-8 space-y-8">
          <Group title="General">
            <label className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/10 px-5 py-4">
              <span>
                <span className="block text-sm font-bold text-white">Launch ClipArk at startup</span>
                <span className="block text-xs font-medium text-white/42">Disabled by default.</span>
              </span>
              <input
                type="checkbox"
                className="rounded border-white/20 bg-black text-ark-accent focus:ring-ark-accent"
                checked={active.launchAtStartup}
                onChange={(event) => void onSave({ ...active, launchAtStartup: event.currentTarget.checked })}
              />
            </label>
          </Group>

          <Group title="History">
            <label className="block text-sm font-bold text-white" htmlFor="max-clips">
              Maximum stored clips
            </label>
            <select
              id="max-clips"
              className="mt-2 h-12 w-56 rounded-full border-white/10 bg-white/10 px-4 text-sm font-semibold text-white shadow-none focus:border-ark-accent focus:ring-ark-accent"
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
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/16"
                onClick={() => void onTrackingPaused(!active.trackingPaused)}
              >
                {active.trackingPaused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                {active.trackingPaused ? "Resume clipboard tracking" : "Pause clipboard tracking"}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-100 transition hover:bg-red-500/15"
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
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/16"
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
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/38">{title}</h3>
      {children}
    </section>
  );
}
