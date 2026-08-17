import clsx from "clsx";
import { Archive, Clipboard, Heart, PauseCircle, Pencil, Plus, Settings, Tag, Trash2 } from "lucide-react";
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
    <aside className="glass-rail absolute left-0 top-0 z-10 hidden h-full w-[214px] flex-col rounded-[38px] px-6 py-6 lg:flex">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-white/24 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
          <Clipboard className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-semibold leading-6 text-white drop-shadow">ClipArk</h1>
          <p className="text-xs font-medium text-white/75">Local clipboard</p>
        </div>
      </div>

      {trackingPaused ? (
        <div className="mb-4 flex items-center gap-2 rounded-full border border-white/35 bg-white/18 px-3 py-2 text-xs font-medium text-white shadow-sm">
          <PauseCircle className="h-4 w-4" aria-hidden />
          Tracking paused
        </div>
      ) : null}

      <nav className="space-y-2" aria-label="Primary">
        <SidebarButton active={activeFilter === "all" && !activeCategoryId} icon={<Archive />} onClick={() => onFilter("all")}>
          History
        </SidebarButton>
        <SidebarButton active={activeFilter === "favorites"} icon={<Heart />} onClick={() => onFilter("favorites")}>
          Favorites
        </SidebarButton>
        <SidebarButton active={activeFilter === "settings"} icon={<Settings />} onClick={() => onFilter("settings")}>
          Settings
        </SidebarButton>
      </nav>

      <div className="mt-8 flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/65">
        <span>Categories</span>
        <button
          type="button"
          onClick={onCreateCategory}
          className="rounded-full p-1.5 text-white/75 transition hover:bg-white/20 hover:text-white"
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
                  ? "bg-white text-black"
                  : "text-white/78 hover:bg-white/18 hover:text-white",
              )}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
              <span className="truncate">{category.name}</span>
            </button>
            <button
              type="button"
              onClick={() => onEditCategory(category)}
              className="rounded-full p-1 text-white/70 opacity-0 transition hover:bg-white/20 hover:text-white group-hover:opacity-100"
              aria-label={`Rename ${category.name}`}
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onDeleteCategory(category)}
              className="rounded-full p-1 text-white/70 opacity-0 transition hover:bg-white/20 hover:text-white group-hover:opacity-100"
              aria-label={`Delete ${category.name}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
        {categories.length === 0 ? (
          <div className="mt-2 flex items-center gap-2 rounded-md px-2 py-3 text-sm text-white/70">
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
        "flex w-full items-center gap-2 rounded-full px-3 py-2.5 text-left text-sm font-semibold transition",
        active ? "bg-white text-black shadow-sm" : "text-white/82 hover:bg-white/18 hover:text-white",
      )}
    >
      <span className="h-4 w-4">{icon}</span>
      <span>{children}</span>
    </button>
  );
}
