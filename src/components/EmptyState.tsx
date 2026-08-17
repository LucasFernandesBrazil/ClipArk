export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-center">
      <p className="text-title font-medium text-ark-text">{title}</p>
      <p className="text-body text-ark-textFaint">{body}</p>
    </div>
  );
}
