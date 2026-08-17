import clsx from "clsx";

type FilterChipProps = {
  active: boolean;
  label: string;
  count?: number;
  color?: string | null;
  onClick: () => void;
};

export function FilterChip({ active, label, count, color, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "flex h-7 shrink-0 items-center gap-1.5 rounded-chip px-2.5 text-body font-medium transition-colors",
        active
          ? "bg-ark-accent text-white"
          : "bg-ark-raised text-ark-textMuted hover:bg-ark-raisedHover hover:text-ark-text",
      )}
    >
      {color ? (
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      ) : null}
      <span>{label}</span>
      {typeof count === "number" ? (
        <span className={clsx("tabular-nums", active ? "text-white/60" : "text-ark-textFaint")}>{count}</span>
      ) : null}
    </button>
  );
}
