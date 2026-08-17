import clsx from "clsx";
import { Archive, Heart, PauseCircle, Pencil, Plus, Settings, Sparkles, Tag, Trash2 } from "lucide-react";
import type { Category, ClipFilter } from "../types";

type SidebarProps = {
  categories: Category[];
  activeFilter: ClipFilter;
  activeCategoryId: string | null;
  trackingPaused: boolean;
  onFilter: (filter: ClipFilter) => void;
  onCategory: (categoryId: string) => void;
  onCreateCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
};

export function Sidebar({
  categories,
  activeFilter,
  activeCategoryId,
  trackingPaused,
  onFilter,
  onCategory,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
}: SidebarProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-ark-border bg-ark-panel/82 px-3 py-4">
      <div className="mb-5 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ark-accentSoft text-ark-accent">
          <Sparkles className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <h1 className="text-base font-semibold leading-5 text-ark-text">ClipArk</h1>
          <p className="text-xs text-ark-muted">Local clipboard memory</p>
        </div>
      </div>

      {trackingPaused ? (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-100">
          <PauseCircle className="h-4 w-4" aria-hidden />
          Tracking paused
        </div>
      ) : null}

      <nav className="space-y-1" aria-label="Primary">
        <SidebarButton active={activeFilter === "all" && !activeCategoryId} icon={<Archive />} onClick={() => onFilter("all")}>
          All Clips
        </SidebarButton>
        <SidebarButton active={activeFilter === "favorites"} icon={<Heart />} onClick={() => onFilter("favorites")}>
          Favorites
        </SidebarButton>
        <SidebarButton active={activeFilter === "settings"} icon={<Settings />} onClick={() => onFilter("settings")}>
          Settings
        </SidebarButton>
      </nav>

      <div className="mt-6 flex items-center justify-between px-2 text-xs font-medium uppercase tracking-[0.18em] text-ark-muted">
        <span>Categories</span>
        <button
          type="button"
          onClick={onCreateCategory}
          className="rounded p-1 text-ark-muted transition hover:bg-white/5 hover:text-ark-text"
          aria-label="Create category"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1 clip-scrollbar">
        {categories.map((category) => (
          <div key={category.id} className="group flex items-center gap-1">
            <button
              type="button"
              onClick={() => onCategory(category.id)}
              className={clsx(
                "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition",
                activeCategoryId === category.id
                  ? "bg-white/8 text-ark-text"
                  : "text-ark-muted hover:bg-white/5 hover:text-ark-text",
              )}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
              <span className="truncate">{category.name}</span>
            </button>
            <button
              type="button"
              onClick={() => onEditCategory(category)}
              className="rounded p-1 text-ark-muted opacity-0 transition hover:bg-white/5 hover:text-ark-text group-hover:opacity-100"
              aria-label={`Rename ${category.name}`}
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onDeleteCategory(category)}
              className="rounded p-1 text-ark-muted opacity-0 transition hover:bg-white/5 hover:text-ark-danger group-hover:opacity-100"
              aria-label={`Delete ${category.name}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
        {categories.length === 0 ? (
          <div className="mt-2 flex items-center gap-2 rounded-md px-2 py-3 text-sm text-ark-muted">
            <Tag className="h-4 w-4" aria-hidden />
            No categories yet
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function SidebarButton({
  active,
  icon,
  onClick,
  children,
}: {
  active: boolean;
  icon: React.ReactElement;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition",
        active ? "bg-white/8 text-ark-text" : "text-ark-muted hover:bg-white/5 hover:text-ark-text",
      )}
    >
      <span className="h-4 w-4">{icon}</span>
      <span>{children}</span>
    </button>
  );
}
