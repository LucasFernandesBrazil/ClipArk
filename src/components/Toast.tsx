import { CheckCircle2, X } from "lucide-react";

type ToastProps = {
  message: string | null;
  onDismiss: () => void;
};

export function Toast({ message, onDismiss }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-md border border-ark-border bg-ark-panelSoft px-4 py-3 text-sm text-ark-text shadow-launcher">
      <CheckCircle2 className="h-4 w-4 text-ark-accent" aria-hidden />
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded p-1 text-ark-muted transition hover:bg-white/5 hover:text-ark-text"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
