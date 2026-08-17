import clsx from "clsx";
import { Braces, Code2, Copy, Heart, Link2, Mail, Palette, Type, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { hostname, previewText, relativeTime, typeLabel } from "../lib/format";
import type { Category, Clip, ClipType } from "../types";

type ClipCardProps = {
  clip: Clip;
  categories: Category[];
  selected: boolean;
  onSelect: () => void;
  onCopy: () => void;
  onFavorite: () => void;
  onDelete: () => void;
  onMove: (categoryId: string | null) => void;
};

export function ClipCard({ clip, categories, selected, onSelect, onCopy, onFavorite, onDelete, onMove }: ClipCardProps) {
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
      tabIndex={0}
      onClick={onSelect}
      onDoubleClick={onCopy}
      onFocus={onSelect}
      onContextMenu={(event) => {
        event.preventDefault();
        onSelect();
        setMenu({ x: event.clientX, y: event.clientY });
      }}
      className={clsx(
        "group relative rounded-md border px-4 py-3 transition",
        selected
          ? "border-ark-accent/70 bg-ark-accentSoft/60 shadow-[0_0_0_1px_rgba(94,234,212,0.16)]"
          : "border-transparent bg-ark-panelSoft/72 hover:border-ark-border hover:bg-ark-panelSoft",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ark-border bg-ark-panel text-ark-muted">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <Preview clip={clip} />
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ark-muted">
            <span>{typeLabel(clip.type)}</span>
            {clip.categoryName ? (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: clip.categoryColor ?? "#8b97a7" }} />
                  {clip.categoryName}
                </span>
              </>
            ) : null}
            <span aria-hidden>·</span>
            <span>{relativeTime(clip.lastCopiedAt)}</span>
            {clip.copiedCount > 1 ? (
              <>
                <span aria-hidden>·</span>
                <span>Copied {clip.copiedCount}x</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <button className="rounded p-1.5 text-ark-muted hover:bg-white/5 hover:text-ark-text" onClick={stop(onCopy)} aria-label="Copy clip">
            <Copy className="h-4 w-4" aria-hidden />
          </button>
          <button
            className={clsx("rounded p-1.5 hover:bg-white/5", clip.favorite ? "text-ark-accent" : "text-ark-muted hover:text-ark-text")}
            onClick={stop(onFavorite)}
            aria-label={clip.favorite ? "Unfavorite clip" : "Favorite clip"}
          >
            <Heart className="h-4 w-4" aria-hidden fill={clip.favorite ? "currentColor" : "none"} />
          </button>
          <button className="rounded p-1.5 text-ark-muted hover:bg-white/5 hover:text-ark-danger" onClick={stop(onDelete)} aria-label="Delete clip">
            <XCircle className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-3 hidden border-t border-ark-border/70 pt-3 group-focus-within:block group-hover:block">
        <label className="sr-only" htmlFor={`category-${clip.id}`}>
          Move clip to category
        </label>
        <select
          id={`category-${clip.id}`}
          value={clip.categoryId ?? ""}
          onChange={(event) => onMove(event.currentTarget.value || null)}
          className="h-8 rounded-md border-ark-border bg-ark-panel text-xs text-ark-text shadow-none focus:border-ark-accent focus:ring-ark-accent"
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {menu ? (
        <div
          className="fixed z-40 w-56 rounded-md border border-ark-border bg-ark-panel p-1 shadow-launcher"
          style={{ left: menu.x, top: menu.y }}
          role="menu"
          onClick={(event) => event.stopPropagation()}
        >
          <ContextButton onClick={onCopy}>Copy</ContextButton>
          <ContextButton onClick={onFavorite}>{clip.favorite ? "Unfavorite" : "Favorite"}</ContextButton>
          <div className="my-1 border-t border-ark-border" />
          <label className="block px-2 py-1 text-xs text-ark-muted" htmlFor={`context-category-${clip.id}`}>
            Move to category
          </label>
          <select
            id={`context-category-${clip.id}`}
            value={clip.categoryId ?? ""}
            onChange={(event) => {
              onMove(event.currentTarget.value || null);
              setMenu(null);
            }}
            className="mb-1 w-full rounded border-ark-border bg-ark-panelSoft text-xs text-ark-text shadow-none focus:border-ark-accent focus:ring-ark-accent"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="my-1 border-t border-ark-border" />
          <ContextButton danger onClick={onDelete}>
            Delete
          </ContextButton>
        </div>
      ) : null}
    </article>
  );
}

function ContextButton({ children, danger, onClick }: { children: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={clsx(
        "flex w-full rounded px-2 py-1.5 text-left text-sm transition hover:bg-white/5",
        danger ? "text-ark-danger" : "text-ark-text",
      )}
    >
      {children}
    </button>
  );
}

function Preview({ clip }: { clip: Clip }) {
  if (clip.type === "color") {
    return (
      <div className="flex min-w-0 items-center gap-2 font-mono text-sm text-ark-text">
        <span className="h-5 w-5 rounded border border-white/20" style={{ backgroundColor: clip.content.trim() }} aria-hidden />
        <span>{clip.content.trim()}</span>
      </div>
    );
  }

  if (clip.type === "url") {
    return (
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-ark-text">{hostname(clip.content)}</div>
        <div className="truncate text-xs text-ark-muted">{clip.content}</div>
      </div>
    );
  }

  const mono = clip.type === "json" || clip.type === "code";
  return (
    <p className={clsx("line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-ark-text", mono && "font-mono text-[13px]")}>
      {mono ? clip.content.slice(0, 900) : previewText(clip.content)}
    </p>
  );
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

function stop(action: () => void) {
  return (event: React.MouseEvent) => {
    event.stopPropagation();
    action();
  };
}
