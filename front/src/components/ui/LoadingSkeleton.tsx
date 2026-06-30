interface Props {
  count?: number;
}

export default function LoadingSkeleton({ count = 3 }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="h-80 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
          <div className="p-6 space-y-3">
            <div className="h-6 bg-gray-200 rounded-lg w-2/3 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-5 bg-gray-100 rounded-full w-16 animate-pulse" />
              <div className="h-5 bg-gray-100 rounded-full w-16 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
