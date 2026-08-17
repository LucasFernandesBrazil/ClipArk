import clsx from "clsx";
import { Braces, Code2, Link2, Mail, Palette, Star, Trash2, Type } from "lucide-react";
import { forwardRef, useEffect, useState } from "react";
import { hostname, previewText, relativeTime, typeLabel } from "../lib/format";
import type { Category, Clip, ClipType } from "../types";

type ClipCardProps = {
  clip: Clip;
  categories: Category[];
  selected: boolean;
  /** 1-9 renders a ⌘N badge; anything else renders none. */
  index: number;
  onSelect: () => void;
  onPaste: () => void;
  onFavorite: () => void;
  onDelete: () => void;
  onMove: (categoryId: string | null) => void;
};

export const ClipCard = forwardRef<HTMLElement, ClipCardProps>(function ClipCard(
  { clip, categories, selected, index, onSelect, onPaste, onFavorite, onDelete, onMove },
  ref,
) {
  const Icon = typeIcon(clip.type);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", close);
    };
  }, [menu]);

  return (
    <article
      ref={ref}
      tabIndex={-1}
      // Clicking a card must not steal focus from the search field — typing has to keep working.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      onDoubleClick={onPaste}
      onContextMenu={(event) => {
        event.preventDefault();
        onSelect();
        setMenu({ x: event.clientX, y: event.clientY });
      }}
      className={clsx(
        "group relative flex h-full w-[228px] shrink-0 snap-start flex-col overflow-hidden rounded-card border p-3 text-left transition-colors",
        selected
          ? "border-ark-accent bg-ark-accentSoft"
          : "border-ark-hairline bg-ark-raised hover:bg-ark-raisedHover",
      )}
      aria-current={selected ? "true" : undefined}
    >
      <header className="flex shrink-0 items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: typeColor(clip.type) }} aria-hidden />
        <span className="text-caption font-medium uppercase tracking-wide" style={{ color: typeColor(clip.type) }}>
          {typeLabel(clip.type)}
        </span>
        {clip.categoryName ? (
          <span className="flex min-w-0 items-center gap-1 text-caption text-ark-textFaint">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: clip.categoryColor ?? "#8e8e93" }}
              aria-hidden
            />
            <span className="truncate">{clip.categoryName}</span>
          </span>
        ) : null}

        <span className="ml-auto flex shrink-0 items-center gap-1">
          {clip.favorite ? (
            <Star className="h-3.5 w-3.5 text-[#ffd60a]" fill="currentColor" aria-label="Favorite" />
          ) : null}
          {index < 9 ? (
            <kbd className="rounded bg-ark-raisedActive px-1 py-px font-sans text-caption font-medium text-ark-textFaint group-hover:opacity-0">
              ⌘{index + 1}
            </kbd>
          ) : null}
        </span>
      </header>

      <div className="mt-2 min-h-0 flex-1 overflow-hidden">
        <Preview clip={clip} />
      </div>

      <footer className="mt-2 flex shrink-0 items-center gap-2 text-caption text-ark-textFaint">
        <span className="truncate">{relativeTime(clip.lastCopiedAt)}</span>
        {clip.copiedCount > 1 ? <span className="tabular-nums">·  used {clip.copiedCount}×</span> : null}
      </footer>

      {/* Hover actions. Paste is the click/Enter action, so it is not repeated here. */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <HoverAction label={clip.favorite ? "Unfavorite" : "Favorite"} onClick={onFavorite}>
          <Star className="h-3.5 w-3.5" fill={clip.favorite ? "currentColor" : "none"} aria-hidden />
        </HoverAction>
        <HoverAction label="Delete" danger onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </HoverAction>
      </div>

      {menu ? (
        <div
          className="fixed z-50 w-52 rounded-card border border-ark-hairline bg-ark-surface p-1.5 shadow-launcher backdrop-blur-xl"
          style={{ left: menu.x, top: menu.y }}
          role="menu"
          onClick={(event) => event.stopPropagation()}
        >
          <ContextButton onClick={onPaste}>Paste</ContextButton>
          <ContextButton onClick={onFavorite}>{clip.favorite ? "Unfavorite" : "Favorite"}</ContextButton>
          <div className="my-1 border-t border-ark-hairline" />
          <label className="block px-2 pb-1 text-caption text-ark-textFaint" htmlFor={`context-category-${clip.id}`}>
            Move to category
          </label>
          <select
            id={`context-category-${clip.id}`}
            value={clip.categoryId ?? ""}
            onChange={(event) => {
              onMove(event.currentTarget.value || null);
              setMenu(null);
            }}
            className="mb-1 h-7 w-full rounded-chip border-ark-hairline bg-ark-raised px-2 py-0 text-body text-ark-text focus:border-ark-accent focus:ring-1 focus:ring-ark-accent"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="my-1 border-t border-ark-hairline" />
          <ContextButton danger onClick={onDelete}>
            Delete
          </ContextButton>
        </div>
      ) : null}
    </article>
  );
});

function HoverAction({
  label,
  danger,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={clsx(
        "flex h-6 w-6 items-center justify-center rounded-chip bg-black/45 backdrop-blur transition-colors",
        danger ? "text-ark-textMuted hover:bg-ark-danger hover:text-white" : "text-ark-textMuted hover:text-ark-text",
      )}
    >
      {children}
    </button>
  );
}

function ContextButton({ children, danger, onClick }: { children: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={clsx(
        "flex w-full rounded-chip px-2 py-1 text-left text-body transition-colors",
        danger ? "text-ark-danger hover:bg-ark-dangerSoft" : "text-ark-text hover:bg-ark-raisedHover",
      )}
    >
      {children}
    </button>
  );
}

function Preview({ clip }: { clip: Clip }) {
  if (clip.type === "color") {
    const color = clip.content.trim();
    return (
      <div className="flex items-center gap-2">
        <span
          className="h-8 w-8 shrink-0 rounded-chip border border-ark-hairline"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <span className="truncate font-mono text-body text-ark-text">{color}</span>
      </div>
    );
  }

  if (clip.type === "url") {
    return (
      <div className="min-w-0">
        <p className="truncate text-title font-medium text-ark-text">{hostname(clip.content)}</p>
        <p className="mt-0.5 line-clamp-3 break-words text-body text-ark-textMuted">{clip.content}</p>
      </div>
    );
  }

  const mono = clip.type === "json" || clip.type === "code";
  if (mono) {
    return (
      <pre className="line-clamp-[9] whitespace-pre-wrap break-words font-mono text-caption leading-[15px] text-ark-textMuted">
        {clip.content.slice(0, 480)}
      </pre>
    );
  }

  return (
    <p className="line-clamp-[7] break-words text-body text-ark-text">{previewText(clip.content, 400)}</p>
  );
}

function typeColor(type: ClipType) {
  switch (type) {
    case "url":
      return "#64d2ff";
    case "email":
      return "#5e5ce6";
    case "color":
      return "#ff9f0a";
    case "json":
    case "code":
      return "#30d158";
    default:
      return "rgba(245, 245, 247, 0.38)";
  }
}

function typeIcon(type: ClipType) {
  switch (type) {
    case "url":
      return Link2;
    case "email":
      return Mail;
    case "color":
      return Palette;
    case "json":
      return Braces;
    case "code":
      return Code2;
    default:
      return Type;
  }
}
