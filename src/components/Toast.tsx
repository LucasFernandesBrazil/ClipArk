import { CheckCircle2, X } from "lucide-react";

type ToastProps = {
  message: string | null;
  onDismiss: () => void;
};

export function Toast({ message, onDismiss }: ToastProps) {
  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-50 flex justify-center">
      <div className="pointer-events-auto flex max-w-[80%] items-center gap-2 rounded-chip border border-ark-hairline bg-ark-surface px-2.5 py-1.5 text-body text-ark-text shadow-launcher backdrop-blur-xl">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-ark-accent" aria-hidden />
        <span className="truncate">{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 text-ark-textFaint transition-colors hover:bg-ark-raisedHover hover:text-ark-text"
          aria-label="Dismiss notification"
        >
          <X className="h-3 w-3" aria-hidden />
        </button>
      </div>
    </div>
  );
}
