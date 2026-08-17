import { useState } from "react";
import type { Category } from "../types";

export const categoryColors = ["#5eead4", "#a78bfa", "#fda4af", "#facc15", "#60a5fa", "#34d399"];

type CategoryDialogProps = {
  mode: "create" | "edit";
  category?: Category;
  onSubmit: (name: string, color: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
};

export function CategoryDialog({ mode, category, onSubmit, onDelete, onCancel }: CategoryDialogProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? categoryColors[0]);

  return (
    <Overlay onCancel={onCancel}>
      <form
        className="w-full max-w-xs rounded-shell border border-ark-hairline bg-ark-surface p-4 shadow-launcher backdrop-blur-xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) void onSubmit(name, color);
        }}
      >
        <h3 className="text-title font-semibold text-ark-text">
          {mode === "edit" ? "Edit category" : "New category"}
        </h3>

        <label className="mt-4 block text-caption font-medium uppercase tracking-wide text-ark-textFaint" htmlFor="category-name">
          Name
        </label>
        <input
          id="category-name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          className="mt-1.5 h-8 w-full rounded-chip border-ark-hairline bg-ark-raised px-2.5 text-body text-ark-text focus:border-ark-accent focus:ring-1 focus:ring-ark-accent"
          autoFocus
        />

        <span className="mt-4 block text-caption font-medium uppercase tracking-wide text-ark-textFaint">Color</span>
        <div className="mt-1.5 flex gap-2">
          {categoryColors.map((candidate) => (
            <button
              key={candidate}
              type="button"
              aria-label={`Use ${candidate}`}
              aria-pressed={color === candidate}
              onClick={() => setColor(candidate)}
              className="h-6 w-6 rounded-full ring-offset-2 ring-offset-[#141416] transition"
              style={{
                backgroundColor: candidate,
                boxShadow: color === candidate ? `0 0 0 2px #141416, 0 0 0 4px ${candidate}` : "none",
              }}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {onDelete ? (
            <button
              type="button"
              onClick={() => void onDelete()}
              className="rounded-chip px-2.5 py-1.5 text-body font-medium text-ark-danger transition-colors hover:bg-ark-dangerSoft"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-chip px-3 py-1.5 text-body font-medium text-ark-textMuted transition-colors hover:bg-ark-raisedHover hover:text-ark-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-chip bg-ark-accent px-3 py-1.5 text-body font-semibold text-white transition-colors hover:brightness-110"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </Overlay>
  );
}

type ConfirmDialogProps = {
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ title, body, confirmLabel, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <Overlay onCancel={onCancel}>
      <div className="w-full max-w-xs rounded-shell border border-ark-hairline bg-ark-surface p-4 shadow-launcher backdrop-blur-xl">
        <h3 className="text-title font-semibold text-ark-text">{title}</h3>
        <p className="mt-1.5 text-body text-ark-textMuted">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-chip px-3 py-1.5 text-body font-medium text-ark-textMuted transition-colors hover:bg-ark-raisedHover hover:text-ark-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-chip bg-ark-danger px-3 py-1.5 text-body font-semibold text-white transition-colors hover:brightness-110"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/** Clicking the backdrop dismisses. Escape is handled centrally in `useLauncherKeys`. */
function Overlay({ children, onCancel }: { children: React.ReactNode; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-5"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      {children}
    </div>
  );
}
