import { listen } from "@tauri-apps/api/event";
import { Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ClipCard } from "./components/ClipCard";
import { SettingsPanel } from "./components/SettingsPanel";
import { Sidebar } from "./components/Sidebar";
import { Toast } from "./components/Toast";
import { useDebouncedEffect } from "./hooks/useDebouncedEffect";
import { clearHistory, copyClip, deleteClip, hideWindow, moveClipToCategory, seedDevData, toggleFavorite, updateCategory } from "./lib/tauri";
import { useClipStore } from "./stores/useClipStore";
import type { Category } from "./types";

const categoryColors = ["#5eead4", "#a78bfa", "#fda4af", "#facc15", "#60a5fa", "#34d399"];

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
  const [toast, setToast] = useState<string | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState<{ mode: "create" | "edit"; category?: Category } | null>(null);
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
      searchRef.current?.focus();
      searchRef.current?.select();
      void refreshClips();
    }).then((cleanup) => cleanups.push(cleanup));
    void listen("open-settings", () => {
      setFilter("settings");
    }).then((cleanup) => cleanups.push(cleanup));
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [refreshClips, setFilter]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (filter === "settings") return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = clips[Math.min(clips.length - 1, selectedIndex + 1)] ?? clips[0];
        setSelectedId(next?.id ?? null);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        const previous = clips[Math.max(0, selectedIndex - 1)] ?? clips[0];
        setSelectedId(previous?.id ?? null);
      }
      if (event.key === "Enter" && selectedId) {
        event.preventDefault();
        void handleCopy(selectedId, true);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        void hideWindow();
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        void handleDelete(selectedId);
      }
      if (mod && event.key.toLowerCase() === "d" && selectedId) {
        event.preventDefault();
        void handleFavorite(selectedId);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clips, filter, selectedId, selectedIndex, setSelectedId]);

  async function handleCopy(id: string, hideAfter = false) {
    await copyClip(id);
    setToast("Copied to clipboard");
    await refreshClips();
    if (hideAfter) await hideWindow();
  }

  async function handleFavorite(id: string) {
    await toggleFavorite(id);
    setToast("Favorite updated");
    await refreshClips();
  }

  async function handleDelete(id: string) {
    await deleteClip(id);
    setToast("Clip deleted");
    await refreshClips();
  }

  async function handleMove(id: string, categoryId: string | null) {
    await moveClipToCategory(id, categoryId);
    setToast(categoryId ? "Moved to category" : "Removed from category");
    await refreshClips();
  }

  async function handleCreateCategory(name: string, color: string) {
    await createCategory(name.trim(), color);
    setToast("Category created");
  }

  async function handleEditCategory(category: Category, name: string, color: string) {
    await updateCategory({ id: category.id, name: name.trim(), color, icon: category.icon ?? null });
    await useClipStore.getState().refreshCategories();
    await refreshClips();
    setToast("Category updated");
  }

  async function handleDeleteCategory(category: Category) {
    await deleteCategory(category.id);
    setToast("Category deleted");
  }

  async function handleClearHistory() {
    await clearHistory();
    setClearDialogOpen(false);
    setToast("Clipboard history cleared");
    await refreshClips();
  }

  const activeCategory = categories.find((category) => category.id === activeCategoryId);

  return (
    <div className="dark flex h-full w-full bg-ark-bg text-ark-text">
      <Sidebar
        categories={categories}
        activeFilter={filter}
        activeCategoryId={activeCategoryId}
        trackingPaused={settings?.trackingPaused ?? false}
        onFilter={setFilter}
        onCategory={setActiveCategoryId}
        onCreateCategory={() => setCategoryDialog({ mode: "create" })}
        onEditCategory={(category) => setCategoryDialog({ mode: "edit", category })}
        onDeleteCategory={(category) => {
          setCategoryDialog({ mode: "edit", category });
        }}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-ark-border bg-ark-bg/88 px-5">
          <div className="min-w-0 flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ark-muted" aria-hidden />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                className="h-10 w-full rounded-md border border-ark-border bg-ark-panel pl-10 pr-4 text-sm text-ark-text placeholder:text-ark-muted focus:border-ark-accent focus:ring-ark-accent"
                placeholder="Search clips, types, categories..."
                aria-label="Search clipboard history"
                autoFocus
              />
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-ark-muted md:flex">
            <kbd className="rounded border border-ark-border bg-ark-panelSoft px-1.5 py-1">↑↓</kbd>
            <span>Navigate</span>
            <kbd className="rounded border border-ark-border bg-ark-panelSoft px-1.5 py-1">Enter</kbd>
            <span>Copy</span>
          </div>
        </header>

        {filter === "settings" ? (
          <SettingsPanel
            settings={settings}
            onSave={saveSettings}
            onTrackingPaused={setTrackingPaused}
            onClearHistory={() => setClearDialogOpen(true)}
            onSeed={async () => {
              await seedDevData();
              await refreshClips();
              setToast("Sample clips added");
            }}
          />
        ) : (
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-ark-border/70 px-5">
              <div>
                <h2 className="text-sm font-semibold text-ark-text">
                  {filter === "favorites" ? "Favorites" : activeCategory ? activeCategory.name : "Clipboard history"}
                </h2>
                <p className="text-xs text-ark-muted">{clips.length} visible clips</p>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-ark-border bg-ark-panelSoft px-3 py-2 text-xs text-ark-muted">
                <ShieldCheck className="h-4 w-4 text-ark-accent" aria-hidden />
                Offline only
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 clip-scrollbar">
              {loading ? <EmptyState title="Loading clips..." body="Preparing your local archive." /> : null}
              {error ? <EmptyState title="Something went wrong" body={error} /> : null}
              {!loading && !error && clips.length === 0 ? (
                <EmptyState
                  title={query ? "No clips found." : "Your clipboard is empty."}
                  body={query ? "Try a different search." : "Copy something and it will appear here."}
                />
              ) : null}
              <div className="space-y-2">
                {clips.map((clip) => (
                  <ClipCard
                    key={clip.id}
                    clip={clip}
                    categories={categories}
                    selected={clip.id === selectedId}
                    onSelect={() => setSelectedId(clip.id)}
                    onCopy={() => void handleCopy(clip.id)}
                    onFavorite={() => void handleFavorite(clip.id)}
                    onDelete={() => void handleDelete(clip.id)}
                    onMove={(categoryId) => void handleMove(clip.id, categoryId)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {categoryDialog ? (
        <CategoryDialog
          mode={categoryDialog.mode}
          category={categoryDialog.category}
          onCancel={() => setCategoryDialog(null)}
          onDelete={
            categoryDialog.category
              ? async () => {
                  await handleDeleteCategory(categoryDialog.category!);
                  setCategoryDialog(null);
                }
              : undefined
          }
          onSubmit={async (name, color) => {
            if (categoryDialog.mode === "edit" && categoryDialog.category) {
              await handleEditCategory(categoryDialog.category, name, color);
            } else {
              await handleCreateCategory(name, color);
            }
            setCategoryDialog(null);
          }}
        />
      ) : null}

      {clearDialogOpen ? (
        <ConfirmDialog
          title="Clear clipboard history?"
          body="This removes every saved clip from this computer. Categories and settings stay in place."
          confirmLabel="Clear history"
          onCancel={() => setClearDialogOpen(false)}
          onConfirm={() => void handleClearHistory()}
        />
      ) : null}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex h-full min-h-[18rem] flex-col items-center justify-center text-center">
      <h3 className="text-base font-semibold text-ark-text">{title}</h3>
      <p className="mt-1 text-sm text-ark-muted">{body}</p>
    </div>
  );
}

function CategoryDialog({
  mode,
  category,
  onSubmit,
  onDelete,
  onCancel,
}: {
  mode: "create" | "edit";
  category?: Category;
  onSubmit: (name: string, color: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? categoryColors[0]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-5" role="dialog" aria-modal="true">
      <form
        className="w-full max-w-sm rounded-md border border-ark-border bg-ark-panel p-5 shadow-launcher"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) void onSubmit(name, color);
        }}
      >
        <h3 className="text-base font-semibold text-ark-text">{mode === "edit" ? "Edit category" : "New category"}</h3>
        <label className="mt-4 block text-sm text-ark-text" htmlFor="category-name">
          Name
        </label>
        <input
          id="category-name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          className="mt-2 h-10 w-full rounded-md border-ark-border bg-ark-panelSoft text-sm text-ark-text focus:border-ark-accent focus:ring-ark-accent"
          autoFocus
        />
        <div className="mt-4">
          <span className="block text-sm text-ark-text">Color</span>
          <div className="mt-2 flex gap-2">
            {categoryColors.map((candidate) => (
              <button
                key={candidate}
                type="button"
                aria-label={`Use ${candidate}`}
                onClick={() => setColor(candidate)}
                className="h-7 w-7 rounded-full border"
                style={{ backgroundColor: candidate, borderColor: color === candidate ? "#f4f7fb" : "transparent" }}
              />
            ))}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          {onDelete ? (
            <button type="button" onClick={() => void onDelete()} className="rounded-md px-3 py-2 text-sm text-ark-danger hover:bg-red-500/10">
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="rounded-md px-3 py-2 text-sm text-ark-muted hover:bg-white/5">
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-ark-accent px-3 py-2 text-sm font-medium text-black hover:bg-ark-accent/90">
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-5" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-md border border-ark-border bg-ark-panel p-5 shadow-launcher">
        <h3 className="text-base font-semibold text-ark-text">{title}</h3>
        <p className="mt-2 text-sm text-ark-muted">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-md px-3 py-2 text-sm text-ark-muted hover:bg-white/5">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="rounded-md bg-ark-danger px-3 py-2 text-sm font-medium text-white hover:bg-ark-danger/90">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
