interface Props {
  count?: number;
}

export default function LoadingSkeleton({ count = 3 }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="ui-card overflow-hidden"
          style={{ transform: `rotate(${[-0.7, 0.6, -0.4][i % 3]}deg)` }}
        >
          <div className="h-48 sm:h-56 bg-[var(--color-surface-2)] animate-pulse" />
          <div className="p-4 sm:p-5 space-y-3">
            <div className="h-3 w-24 bg-[var(--color-surface-2)] rounded animate-pulse" />
            <div className="h-6 w-3/4 bg-[var(--color-surface-2)] rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-[var(--color-surface-2)] rounded animate-pulse mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}
