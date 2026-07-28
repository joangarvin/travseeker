interface Props {
  count?: number;
}

export default function LoadingSkeleton({ count = 3 }: Props) {
  return (
    <div className="loading-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="loading-skeleton__card ui-card"
          style={{ transform: `rotate(${[-0.7, 0.6, -0.4][i % 3]}deg)` }}
        >
          <div className="loading-skeleton__image" />
          <div className="loading-skeleton__body">
            <div className="loading-skeleton__line loading-skeleton__line--sm" />
            <div className="loading-skeleton__line loading-skeleton__line--lg" />
            <div className="loading-skeleton__line loading-skeleton__line--md" />
          </div>
        </div>
      ))}
    </div>
  );
}
