import clsx from "clsx";

type IconButtonProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

export function IconButton({ label, active, onClick, children }: IconButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={clsx(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-chip transition-colors",
        active
          ? "bg-ark-accent text-white"
          : "text-ark-textMuted hover:bg-ark-raisedHover hover:text-ark-text",
      )}
    >
      {children}
    </button>
  );
}
