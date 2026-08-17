import { useEffect } from "react";

type LauncherKeyHandlers = {
  /** Suspends every shortcut except Escape, which closes the dialog. */
  modalOpen: boolean;
  onCloseModal: () => void;
  /** -1 when nothing is selected. */
  selectedIndex: number;
  count: number;
  /** Relative move; resolved against live state so fast key repeats are never dropped. */
  onMoveSelection: (step: -1 | 1) => void;
  onSelectIndex: (index: number) => void;
  onPasteIndex: (index: number) => void;
  onPasteSelected: () => void;
  onCopySelected: () => void;
  onFavoriteSelected: () => void;
  onDeleteSelected: () => void;
  onCycleFilter: (direction: 1 | -1) => void;
  onFocusSearch: () => void;
  /** Escape clears a non-empty query before it closes the window. */
  onEscape: () => void;
};

/**
 * All launcher shortcuts in one place. The search input keeps focus at all times,
 * so navigation keys are intercepted here before the input can act on them.
 */
export function useLauncherKeys(handlers: LauncherKeyHandlers) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;

      if (handlers.modalOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          handlers.onCloseModal();
        }
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        handlers.onEscape();
        return;
      }

      if (mod && event.key.toLowerCase() === "f") {
        event.preventDefault();
        handlers.onFocusSearch();
        return;
      }

      // ⌘1-9 pastes the nth clip outright — the fastest path there is.
      if (mod && /^[1-9]$/.test(event.key)) {
        event.preventDefault();
        const index = Number(event.key) - 1;
        if (index < handlers.count) handlers.onPasteIndex(index);
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        handlers.onCycleFilter(event.shiftKey ? -1 : 1);
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        if (handlers.count === 0) return;
        event.preventDefault();
        handlers.onMoveSelection(event.key === "ArrowRight" ? 1 : -1);
        return;
      }

      if (event.key === "Home" || event.key === "End") {
        if (handlers.count === 0) return;
        event.preventDefault();
        handlers.onSelectIndex(event.key === "Home" ? 0 : handlers.count - 1);
        return;
      }

      if (event.key === "Enter" && handlers.selectedIndex >= 0) {
        event.preventDefault();
        handlers.onPasteSelected();
        return;
      }

      if (mod && event.key.toLowerCase() === "c" && handlers.selectedIndex >= 0) {
        event.preventDefault();
        handlers.onCopySelected();
        return;
      }

      if (mod && event.key.toLowerCase() === "d" && handlers.selectedIndex >= 0) {
        event.preventDefault();
        handlers.onFavoriteSelected();
        return;
      }

      // ⌘⌫ only — a bare Backspace has to stay available for editing the query.
      if (mod && (event.key === "Backspace" || event.key === "Delete") && handlers.selectedIndex >= 0) {
        event.preventDefault();
        handlers.onDeleteSelected();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
