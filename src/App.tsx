import { listen } from "@tauri-apps/api/event";
import { Clipboard, Grid2X2, Plus, Search, Settings, Star } from "lucide-react";
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

  const totalCount = clips.length;
  const favoriteCount = clips.filter((clip) => clip.favorite).length;
  const colorCount = clips.filter((clip) => clip.type === "color").length;
  const urlCount = clips.filter((clip) => clip.type === "url").length;
  const codeCount = clips.filter((clip) => clip.type === "code" || clip.type === "json").length;
  const topCategories = categories
    .filter((category) => !["history", "favorites", "colors", "links", "code", "settings"].includes(category.name.toLowerCase()))
    .slice(0, 4);

  return (
    <div className="dark relative flex h-full w-full overflow-hidden p-1 text-ark-text sm:p-2">
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

      <main className="launcher-shell relative ml-0 flex min-w-0 flex-1 flex-col overflow-hidden px-5 py-5 lg:ml-[168px] lg:px-6 lg:py-5">
        <header className="shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-0 top-1/2 h-6 w-6 -translate-y-1/2 text-white/42" aria-hidden />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                className="h-11 w-[min(44vw,520px)] border-0 bg-transparent pl-10 pr-4 text-[22px] font-semibold text-white placeholder:text-white/34 focus:outline-none focus:ring-0"
                placeholder="Search..."
                aria-label="Search clipboard history"
                autoFocus
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <CircleButton label="Favorites" active={filter === "favorites"} onClick={() => setFilter("favorites")}>
                <Star className="h-5 w-5" aria-hidden fill={filter === "favorites" ? "currentColor" : "none"} />
              </CircleButton>
              <CircleButton label="All clips" active={filter === "all" && !activeCategoryId} onClick={() => setFilter("all")}>
                <Grid2X2 className="h-5 w-5" aria-hidden />
              </CircleButton>
              <CircleButton label="Settings" active={filter === "settings"} onClick={() => setFilter("settings")}>
                <Settings className="h-5 w-5" aria-hidden />
              </CircleButton>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-2 clip-scrollbar">
            <FilterChip active={filter === "all" && !query && !activeCategoryId} label="History" count={totalCount} onClick={() => {
              setFilter("all");
              setQuery("");
            }} />
            <FilterChip active={filter === "favorites"} label="Favorites" count={favoriteCount} onClick={() => setFilter("favorites")} />
            <FilterChip active={query === "color"} label="Colors" count={colorCount} onClick={() => {
              setFilter("all");
              setQuery("color");
            }} />
            <FilterChip active={query === "url"} label="Links" count={urlCount} onClick={() => {
              setFilter("all");
              setQuery("url");
            }} />
            <FilterChip active={query === "code"} label="Code" count={codeCount} onClick={() => {
              setFilter("all");
              setQuery("code");
            }} />
            {topCategories.map((category) => (
              <FilterChip
                key={category.id}
                active={activeCategoryId === category.id}
                label={category.name}
                onClick={() => setActiveCategoryId(category.id)}
              />
            ))}
            <button
              type="button"
              onClick={() => setCategoryDialog({ mode: "create" })}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/12 text-white/70 transition hover:bg-white/18 hover:text-white"
              aria-label="Create category"
            >
              <Plus className="h-7 w-7" aria-hidden />
            </button>
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
            <div className="mt-3 flex shrink-0 items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white/74">
                  {filter === "favorites" ? "Favorites" : activeCategory ? activeCategory.name : "Today"}
                </h2>
                <p className="mt-1 text-xs font-medium text-white/30">{clips.length} visible clips</p>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white/52 md:flex">
                <Clipboard className="h-4 w-4 text-ark-accent" aria-hidden />
                Offline only
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pb-5 pt-4 clip-scrollbar">
              {loading ? <EmptyState title="Loading clips..." body="Preparing your local archive." /> : null}
              {error ? <EmptyState title="Something went wrong" body={error} /> : null}
              {!loading && !error && clips.length === 0 ? (
                <EmptyState
                  title={query ? "No clips found." : "Your clipboard is empty."}
                  body={query ? "Try a different search." : "Copy something and it will appear here."}
                />
              ) : null}
              <div className="grid auto-rows-[156px] grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
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

function CircleButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
        active ? "bg-white text-black" : "bg-white/14 text-white/62 hover:bg-white/20 hover:text-white"
      }`}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 shrink-0 items-center gap-2 rounded-full px-5 text-lg font-semibold transition ${
        active ? "bg-white text-[#505056]" : "bg-white/12 text-white/66 hover:bg-white/18 hover:text-white"
      }`}
    >
      <span>{label}</span>
      {typeof count === "number" ? <span className={active ? "text-black/42" : "text-white/28"}>{count}</span> : null}
    </button>
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form
        className="w-full max-w-sm rounded-[28px] border border-white/10 bg-black p-6 shadow-launcher"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) void onSubmit(name, color);
        }}
      >
        <h3 className="text-xl font-bold text-white">{mode === "edit" ? "Edit category" : "New category"}</h3>
        <label className="mt-5 block text-sm font-semibold text-white/70" htmlFor="category-name">
          Name
        </label>
        <input
          id="category-name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          className="mt-2 h-12 w-full rounded-full border-white/10 bg-white/10 px-4 text-sm text-white focus:border-ark-accent focus:ring-ark-accent"
          autoFocus
        />
        <div className="mt-4">
          <span className="block text-sm font-semibold text-white/70">Color</span>
          <div className="mt-2 flex gap-2">
            {categoryColors.map((candidate) => (
              <button
                key={candidate}
                type="button"
                aria-label={`Use ${candidate}`}
                onClick={() => setColor(candidate)}
                className="h-8 w-8 rounded-full border-2"
                style={{ backgroundColor: candidate, borderColor: color === candidate ? "#f4f7fb" : "transparent" }}
              />
            ))}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          {onDelete ? (
            <button type="button" onClick={() => void onDelete()} className="rounded-full px-4 py-2 text-sm font-semibold text-ark-danger hover:bg-red-500/10">
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm font-semibold text-white/56 hover:bg-white/10">
              Cancel
            </button>
            <button type="submit" className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black hover:bg-white/90">
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-black p-6 shadow-launcher">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-white/56">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm font-semibold text-white/56 hover:bg-white/10">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="rounded-full bg-ark-danger px-5 py-2 text-sm font-bold text-white hover:bg-ark-danger/90">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
