import clsx from "clsx";
import { Braces, Code2, Copy, Eye, Heart, Link2, Mail, Palette, Type, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { hostname, previewText, relativeTime } from "../lib/format";
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
        "clip-card-surface group relative h-full overflow-hidden rounded-[22px] border transition duration-200",
        selected
          ? "border-ark-accent bg-ark-panelSoft shadow-[0_0_0_3px_rgba(0,128,255,0.45)]"
          : "border-white/10 bg-ark-panelSoft hover:border-white/24",
      )}
      style={cardStyle(clip)}
    >
      <div className="absolute right-3 top-3 z-20 flex items-center gap-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        <button className="rounded-full bg-black/45 p-2 text-white/80 backdrop-blur hover:bg-black/62 hover:text-white" onClick={stop(onCopy)} aria-label="Copy clip">
            <Copy className="h-4 w-4" aria-hidden />
          </button>
          <button
          className={clsx(
            "rounded-full bg-black/45 p-2 backdrop-blur hover:bg-black/62 hover:text-white",
            clip.favorite ? "text-white" : "text-white/75",
          )}
            onClick={stop(onFavorite)}
            aria-label={clip.favorite ? "Unfavorite clip" : "Favorite clip"}
          >
            <Heart className="h-4 w-4" aria-hidden fill={clip.favorite ? "currentColor" : "none"} />
          </button>
        <button className="rounded-full bg-black/45 p-2 text-white/75 backdrop-blur hover:bg-black/62 hover:text-white" onClick={stop(onDelete)} aria-label="Delete clip">
            <XCircle className="h-4 w-4" aria-hidden />
          </button>
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-white/90 text-black shadow-lg shadow-black/20">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          {selected ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/42 text-white backdrop-blur">
              <Eye className="h-5 w-5" aria-hidden />
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <Preview clip={clip} />
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-white/68">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#54c7ff] text-white shadow">
              <ClipboardGlyph />
            </span>
            <span>{relativeTime(clip.lastCopiedAt)}</span>
            <span className="ml-auto rounded-full bg-black/38 px-2 py-1 text-xs text-white/72 backdrop-blur">
              {clip.copiedCount > 1 ? `x${clip.copiedCount}` : shortcutLabel(clip.type)}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute left-3 top-[54px] z-20 hidden w-[calc(100%-1.5rem)] border-t border-white/12 pt-3 group-focus-within:block group-hover:block">
        <label className="sr-only" htmlFor={`category-${clip.id}`}>
          Move clip to category
        </label>
        <select
          id={`category-${clip.id}`}
          value={clip.categoryId ?? ""}
          onChange={(event) => onMove(event.currentTarget.value || null)}
          className="h-8 max-w-[150px] rounded-full border-white/15 bg-black/42 text-xs text-white shadow-none backdrop-blur focus:border-ark-accent focus:ring-ark-accent"
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
          className="fixed z-40 w-56 rounded-[18px] border border-white/10 bg-black p-2 shadow-launcher"
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
      <div className="pt-6 font-mono text-2xl font-bold text-white drop-shadow">
        <span>{clip.content.trim()}</span>
      </div>
    );
  }

  if (clip.type === "url") {
    return (
      <div className="min-w-0">
        <div className="truncate text-lg font-bold text-white drop-shadow">{hostname(clip.content)}</div>
        <div className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-white/72">{clip.content}</div>
      </div>
    );
  }

  const mono = clip.type === "json" || clip.type === "code";
  return (
    <p className={clsx("line-clamp-3 whitespace-pre-wrap break-words text-lg font-bold leading-6 text-white drop-shadow", mono && "font-mono text-base leading-6")}>
      {mono ? clip.content.slice(0, 260) : previewText(clip.content, 150)}
    </p>
  );
}

function cardStyle(clip: Clip): React.CSSProperties {
  if (clip.type === "color") {
    const color = clip.content.trim();
    return {
      background: `linear-gradient(180deg, ${color} 0%, ${color} 48%, rgba(0,0,0,0.74) 100%)`,
    };
  }

  if (clip.type === "url") {
    return {
      background:
        "linear-gradient(135deg, rgba(236,242,244,0.96) 0%, rgba(255,255,255,0.9) 44%, rgba(0,0,0,0.7) 100%)",
    };
  }

  if (clip.type === "code" || clip.type === "json") {
    return {
      background: "linear-gradient(180deg, #2a28ab 0%, #202194 48%, #06051a 100%)",
    };
  }

  if (clip.type === "email") {
    return {
      background: "linear-gradient(135deg, #0080ff 0%, #0b74d9 48%, #042a58 100%)",
    };
  }

  return {
    background:
      "radial-gradient(circle at 78% 20%, rgba(255,255,255,0.34), transparent 24%), linear-gradient(145deg, #272727 0%, #191919 48%, #050505 100%)",
  };
}

function shortcutLabel(type: ClipType) {
  switch (type) {
    case "color":
      return "^#";
    case "url":
      return "^U";
    case "email":
      return "^@";
    case "code":
      return "^C";
    case "json":
      return "^{ }";
    default:
      return "^V";
  }
}

function ClipboardGlyph() {
  return <Copy className="h-3.5 w-3.5" aria-hidden />;
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
