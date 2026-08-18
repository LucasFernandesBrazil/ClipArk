import { Check, PauseCircle, PlayCircle, Plus, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { accessibilityStatus, appVersion, requestAccessibility } from "../lib/tauri";
import type { AppSettings, Category } from "../types";

type SettingsPanelProps = {
  settings: AppSettings | null;
  categories: Category[];
  onSave: (settings: AppSettings) => Promise<void>;
  onTrackingPaused: (paused: boolean) => Promise<void>;
  onClearHistory: () => void;
  onCreateCategory: () => void;
  onEditCategory: (category: Category) => void;
  onSeed: () => Promise<void>;
};

const limits = [
  { label: "500", value: 500 },
  { label: "1,000", value: 1000 },
  { label: "5,000", value: 5000 },
  { label: "10,000", value: 10000 },
  { label: "Unlimited", value: null },
];

const fallback: AppSettings = {
  launchAtStartup: false,
  maxStoredClips: 5000,
  trackingPaused: false,
  autoPaste: true,
};

export function SettingsPanel({
  settings,
  categories,
  onSave,
  onTrackingPaused,
  onClearHistory,
  onCreateCategory,
  onEditCategory,
  onSeed,
}: SettingsPanelProps) {
  const active = settings ?? fallback;
  const [trusted, setTrusted] = useState<boolean | null>(null);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    void accessibilityStatus().then(setTrusted);
  }, []);

  // Outside a Tauri window (plain `npm run dev`) this rejects; the label just stays hidden.
  useEffect(() => {
    void appVersion().then(setVersion, () => setVersion(null));
  }, []);

  return (
    <section className="clip-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-3">
      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
        <Group title="Pasting">
          <Toggle
            label="Paste into the previous app on ⏎"
            hint="Off: Enter only copies and closes the launcher."
            checked={active.autoPaste}
            onChange={(checked) => void onSave({ ...active, autoPaste: checked })}
          />
          {active.autoPaste ? (
            trusted ? (
              <p className="flex items-center gap-1.5 text-caption text-[#30d158]">
                <Check className="h-3 w-3" aria-hidden />
                Accessibility access granted.
              </p>
            ) : (
              <div className="flex">
                <button
                  type="button"
                  onClick={() => void requestAccessibility().then(setTrusted)}
                  className="flex items-center gap-1.5 rounded-chip bg-ark-dangerSoft px-2.5 py-1.5 text-caption font-medium text-ark-danger transition-colors hover:brightness-110"
                >
                  <ShieldAlert className="h-3 w-3" aria-hidden />
                  Grant Accessibility access
                </button>
              </div>
            )
          ) : null}
        </Group>

        <Group title="General">
          <Toggle
            label="Launch ClipArk at startup"
            checked={active.launchAtStartup}
            onChange={(checked) => void onSave({ ...active, launchAtStartup: checked })}
          />
        </Group>

        <Group title="History">
          <label className="flex items-center justify-between gap-3 text-body text-ark-text" htmlFor="max-clips">
            Maximum stored clips
            <select
              id="max-clips"
              className="h-7 rounded-chip border-ark-hairline bg-ark-raised py-0 pl-2 pr-7 text-body text-ark-text focus:border-ark-accent focus:ring-1 focus:ring-ark-accent"
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
          </label>

          <div className="flex flex-wrap gap-2">
            <SecondaryButton onClick={() => void onTrackingPaused(!active.trackingPaused)}>
              {active.trackingPaused ? <PlayCircle className="h-3.5 w-3.5" /> : <PauseCircle className="h-3.5 w-3.5" />}
              {active.trackingPaused ? "Resume tracking" : "Pause tracking"}
            </SecondaryButton>
            <SecondaryButton danger onClick={onClearHistory}>
              <Trash2 className="h-3.5 w-3.5" />
              Clear history
            </SecondaryButton>
          </div>
        </Group>

        <Group title="Categories">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onEditCategory(category)}
                title={`Edit ${category.name}`}
                className="flex h-7 items-center gap-1.5 rounded-chip bg-ark-raised px-2.5 text-body text-ark-textMuted transition-colors hover:bg-ark-raisedHover hover:text-ark-text"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} aria-hidden />
                {category.name}
              </button>
            ))}
            <SecondaryButton onClick={onCreateCategory}>
              <Plus className="h-3.5 w-3.5" />
              New category
            </SecondaryButton>
          </div>
          {categories.length === 0 ? (
            <p className="text-caption text-ark-textFaint">No categories yet. Right-click a clip to file it into one.</p>
          ) : null}
        </Group>

        {import.meta.env.DEV ? (
          <Group title="Development">
            <div className="flex">
              <SecondaryButton onClick={() => void onSeed()}>
                <RotateCcw className="h-3.5 w-3.5" />
                Seed sample clips
              </SecondaryButton>
            </div>
          </Group>
        ) : null}
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-3 text-caption text-ark-textFaint">
        <p>Everything stays on this Mac — ClipArk never sends your clipboard anywhere.</p>
        {version ? (
          // select-text because styles.css turns selection off for the whole body, and
          // the bug report template asks people to type this number in.
          <span className="shrink-0 select-text tabular-nums" title="ClipArk version">
            v{version}
          </span>
        ) : null}
      </div>
    </section>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-caption font-medium uppercase tracking-wide text-ark-textFaint">{title}</h3>
      {children}
    </section>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="block text-body text-ark-text">{label}</span>
        {hint ? <span className="block text-caption text-ark-textFaint">{hint}</span> : null}
      </span>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-ark-hairline bg-ark-raised text-ark-accent focus:ring-1 focus:ring-ark-accent focus:ring-offset-0"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
    </label>
  );
}

function SecondaryButton({
  children,
  danger,
  onClick,
}: {
  children: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        danger
          ? "inline-flex h-7 items-center gap-1.5 rounded-chip bg-ark-dangerSoft px-2.5 text-body font-medium text-ark-danger transition-colors hover:brightness-110"
          : "inline-flex h-7 items-center gap-1.5 rounded-chip bg-ark-raised px-2.5 text-body font-medium text-ark-textMuted transition-colors hover:bg-ark-raisedHover hover:text-ark-text"
      }
    >
      {children}
    </button>
  );
}
