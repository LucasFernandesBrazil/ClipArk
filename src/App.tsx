import { listen } from "@tauri-apps/api/event";
import { Plus, Search, Settings, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CategoryDialog, ConfirmDialog } from "./components/CategoryDialog";
import { ClipCard } from "./components/ClipCard";
import { EmptyState } from "./components/EmptyState";
import { FilterChip } from "./components/FilterChip";
import { Footer } from "./components/Footer";
import { IconButton } from "./components/IconButton";
import { SettingsPanel } from "./components/SettingsPanel";
import { Toast } from "./components/Toast";
import { useDebouncedEffect } from "./hooks/useDebouncedEffect";
import { useLauncherKeys } from "./hooks/useLauncherKeys";
import { previewText } from "./lib/format";
import {
  ACCESSIBILITY_DENIED,
  clearHistory,
  copyClip,
  deleteClip,
  hideWindow,
  moveClipToCategory,
  pasteClip,
  requestAccessibility,
  seedDevData,
  toggleFavorite,
  updateCategory,
} from "./lib/tauri";
import { useClipStore } from "./stores/useClipStore";
import type { Category } from "./types";

type Chip = {
  key: string;
  label: string;
  count?: number;
  color?: string;
  apply: () => void;
};

type Confirmation = {
  title: string;
  body: string;
  confirmLabel: string;
  run: () => Promise<void>;
};

export default function App() {
  const {
    clips,
    categories,
    settings,
    query,
    filter,
    selectedId,
    activeCategoryId,
    loading,
    error,
    setQuery,
    setFilter,
    setActiveCategoryId,
    setSelectedId,
    loadAll,
    refreshClips,
    createCategory,
    deleteCategory,
    setTrackingPaused,
    saveSettings,
  } = useClipStore();

  const searchRef = useRef<HTMLInputElement>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const [toast, setToast] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [categoryDialog, setCategoryDialog] = useState<{ mode: "create" | "edit"; category?: Category } | null>(null);

  const showingSettings = filter === "settings";
  const modalOpen = categoryDialog !== null || confirmation !== null;
  const autoPaste = settings?.autoPaste ?? true;
  const selectedIndex = useMemo(() => clips.findIndex((clip) => clip.id === selectedId), [clips, selectedId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useDebouncedEffect(() => refreshClips(), [query, filter, activeCategoryId], 110);

  useEffect(() => {
    const cleanups: Array<() => void> = [];
    void listen("clips-changed", () => {
      void refreshClips();
    }).then((cleanup) => cleanups.push(cleanup));
    void listen("launcher-opened", () => {
      // A fresh invocation should always start from a clean slate.
      setQuery("");
      searchRef.current?.focus();
      searchRef.current?.select();
      void refreshClips();
    }).then((cleanup) => cleanups.push(cleanup));
    void listen("open-settings", () => {
      setFilter("settings");
    }).then((cleanup) => cleanups.push(cleanup));
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [refreshClips, setFilter, setQuery]);

  useEffect(() => {
    if (!modalOpen) searchRef.current?.focus();
  }, [modalOpen]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  // Keep the selected card inside the horizontal viewport.
  useEffect(() => {
    if (!selectedId) return;
    cardRefs.current.get(selectedId)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [selectedId]);

  const handlePaste = useCallback(
    async (id: string) => {
      if (!autoPaste) {
        await copyClip(id);
        await hideWindow();
        return;
      }
      try {
        await pasteClip(id);
      } catch (pasteError) {
        if (String(pasteError).includes(ACCESSIBILITY_DENIED)) {
          setToast("Grant Accessibility access to paste automatically — see Settings.");
          await requestAccessibility();
          return;
        }
        setToast(String(pasteError));
      }
    },
    [autoPaste],
  );

  const handleCopy = useCallback(async (id: string) => {
    await copyClip(id);
    setToast("Copied to clipboard");
    await refreshClips();
  }, [refreshClips]);

  const handleFavorite = useCallback(async (id: string) => {
    await toggleFavorite(id);
    await refreshClips();
  }, [refreshClips]);

  const handleDelete = useCallback((id: string) => {
    const clip = useClipStore.getState().clips.find((candidate) => candidate.id === id);
    setConfirmation({
      title: "Delete this clip?",
      body: clip
        ? `“${previewText(clip.content, 90)}” will be removed from this Mac.`
        : "This clip will be removed from this Mac.",
      confirmLabel: "Delete clip",
      run: async () => {
        await deleteClip(id);
        setToast("Clip deleted");
        await refreshClips();
      },
    });
  }, [refreshClips]);

  async function runConfirmation() {
    if (!confirmation) return;
    const { run } = confirmation;
    setConfirmation(null);
    await run();
  }

  async function handleMove(id: string, categoryId: string | null) {
    await moveClipToCategory(id, categoryId);
    setToast(categoryId ? "Moved to category" : "Removed from category");
    await refreshClips();
  }

  async function handleEditCategory(category: Category, name: string, color: string) {
    await updateCategory({ id: category.id, name: name.trim(), color, icon: category.icon ?? null });
    await useClipStore.getState().refreshCategories();
    await refreshClips();
    setToast("Category updated");
  }

  function confirmClearHistory() {
    setConfirmation({
      title: "Clear clipboard history?",
      body: "This removes every saved clip from this Mac. Categories and settings stay in place.",
      confirmLabel: "Clear history",
      run: async () => {
        await clearHistory();
        setToast("Clipboard history cleared");
        await refreshClips();
      },
    });
  }

  function confirmDeleteCategory(category: Category) {
    setConfirmation({
      title: `Delete “${category.name}”?`,
      body: "The category is removed. Clips filed under it stay in your history without a category.",
      confirmLabel: "Delete category",
      run: async () => {
        await deleteCategory(category.id);
        setCategoryDialog(null);
        setToast("Category deleted");
      },
    });
  }

  /** Chip order doubles as the Tab cycle order. */
  const chips = useMemo<Chip[]>(
    () => [
      { key: "all", label: "All", count: clips.length, apply: () => setFilter("all") },
      { key: "favorites", label: "Favorites", apply: () => setFilter("favorites") },
      ...categories.map((category) => ({
        key: category.id,
        label: category.name,
        color: category.color,
        apply: () => setActiveCategoryId(category.id),
      })),
    ],
    [categories, clips.length, setActiveCategoryId, setFilter],
  );

  const activeChipIndex = activeCategoryId
    ? chips.findIndex((chip) => chip.key === activeCategoryId)
    : filter === "favorites"
      ? 1
      : 0;

  useLauncherKeys({
    modalOpen,
    onCloseModal: () => {
      if (confirmation) setConfirmation(null);
      else setCategoryDialog(null);
    },
    selectedIndex: showingSettings ? -1 : selectedIndex,
    count: showingSettings ? 0 : clips.length,
    onSelectIndex: (index) => setSelectedId(clips[index]?.id ?? null),
    onMoveSelection: (step) => {
      // Read from the store, not from the render closure: holding an arrow key fires
      // repeats faster than React re-renders.
      const state = useClipStore.getState();
      const current = state.clips.findIndex((clip) => clip.id === state.selectedId);
      const next = Math.min(state.clips.length - 1, Math.max(0, current + step));
      state.setSelectedId(state.clips[next]?.id ?? null);
    },
    onPasteIndex: (index) => {
      const clip = clips[index];
      if (clip) void handlePaste(clip.id);
    },
    onPasteSelected: () => selectedId && void handlePaste(selectedId),
    onCopySelected: () => selectedId && void handleCopy(selectedId),
    onFavoriteSelected: () => selectedId && void handleFavorite(selectedId),
    onDeleteSelected: () => {
      if (selectedId) handleDelete(selectedId);
    },
    onCycleFilter: (direction) => {
      const next = (activeChipIndex + direction + chips.length) % chips.length;
      chips[next]?.apply();
    },
    onFocusSearch: () => searchRef.current?.focus(),
    onEscape: () => {
      if (showingSettings) {
        setFilter("all");
        return;
      }
      if (query) {
        setQuery("");
        searchRef.current?.focus();
        return;
      }
      void hideWindow();
    },
  });

  return (
    <div className="dark flex h-full w-full flex-col overflow-hidden">
      <div className="launcher-shell flex min-h-0 flex-1 flex-col overflow-hidden text-ark-text">
        <header className="flex shrink-0 flex-col gap-2 px-3 pb-2 pt-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex min-w-0 flex-1 items-center">
              <Search className="pointer-events-none absolute left-0 h-4 w-4 text-ark-textFaint" aria-hidden />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                className="h-8 w-full border-0 bg-transparent p-0 pl-6 text-search font-normal text-ark-text placeholder:text-ark-textFaint focus:outline-none focus:ring-0"
                placeholder="Search clipboard…"
                aria-label="Search clipboard history"
                spellCheck={false}
                autoComplete="off"
                autoFocus
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="absolute right-0 flex h-5 w-5 items-center justify-center rounded-full text-ark-textFaint transition-colors hover:bg-ark-raisedHover hover:text-ark-text"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              ) : null}
            </div>

            <IconButton label="Settings" active={showingSettings} onClick={() => setFilter(showingSettings ? "all" : "settings")}>
              <Settings className="h-4 w-4" aria-hidden />
            </IconButton>
          </div>

          {showingSettings ? null : (
            <div className="clip-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {chips.map((chip, index) => (
                <FilterChip
                  key={chip.key}
                  active={index === activeChipIndex}
                  label={chip.label}
                  count={chip.count}
                  color={chip.color}
                  onClick={chip.apply}
                />
              ))}
              <button
                type="button"
                onClick={() => setCategoryDialog({ mode: "create" })}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-chip bg-ark-raised text-ark-textMuted transition-colors hover:bg-ark-raisedHover hover:text-ark-text"
                aria-label="Create category"
                title="Create category"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          )}
        </header>

        {showingSettings ? (
          <SettingsPanel
            settings={settings}
            categories={categories}
            onSave={saveSettings}
            onTrackingPaused={setTrackingPaused}
            onClearHistory={confirmClearHistory}
            onEditCategory={(category) => setCategoryDialog({ mode: "edit", category })}
            onCreateCategory={() => setCategoryDialog({ mode: "create" })}
            onSeed={async () => {
              await seedDevData();
              await refreshClips();
              setToast("Sample clips added");
            }}
          />
        ) : (
          <main className="clip-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory items-stretch gap-2 overflow-x-auto overflow-y-hidden px-3 pb-2">
            {loading ? <EmptyState title="Loading clips…" body="Preparing your local archive." /> : null}
            {!loading && error ? <EmptyState title="Something went wrong" body={error} /> : null}
            {!loading && !error && clips.length === 0 ? (
              <EmptyState
                title={query ? "No clips found" : "Your clipboard is empty"}
                body={query ? "Try a different search." : "Copy something and it will show up here."}
              />
            ) : null}
            {clips.map((clip, index) => (
              <ClipCard
                key={clip.id}
                ref={(element) => {
                  if (element) cardRefs.current.set(clip.id, element);
                  else cardRefs.current.delete(clip.id);
                }}
                clip={clip}
                categories={categories}
                index={index}
                selected={clip.id === selectedId}
                onSelect={() => setSelectedId(clip.id)}
                onPaste={() => void handlePaste(clip.id)}
                onFavorite={() => void handleFavorite(clip.id)}
                onDelete={() => handleDelete(clip.id)}
                onMove={(categoryId) => void handleMove(clip.id, categoryId)}
              />
            ))}
          </main>
        )}

        <Footer
          count={clips.length}
          autoPaste={autoPaste}
          trackingPaused={settings?.trackingPaused ?? false}
          showingSettings={showingSettings}
        />
      </div>

      {categoryDialog ? (
        <CategoryDialog
          mode={categoryDialog.mode}
          category={categoryDialog.category}
          onCancel={() => setCategoryDialog(null)}
          onDelete={
            categoryDialog.category ? () => confirmDeleteCategory(categoryDialog.category!) : undefined
          }
          onSubmit={async (name, color) => {
            if (categoryDialog.mode === "edit" && categoryDialog.category) {
              await handleEditCategory(categoryDialog.category, name, color);
            } else {
              await createCategory(name.trim(), color);
              setToast("Category created");
            }
            setCategoryDialog(null);
          }}
        />
      ) : null}

      {confirmation ? (
        <ConfirmDialog
          title={confirmation.title}
          body={confirmation.body}
          confirmLabel={confirmation.confirmLabel}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void runConfirmation()}
        />
      ) : null}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
