export default function CardSkeleton({ count = 4 }) {
  return (
    <div className="skeleton-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card skeleton-pulse" key={i}>
          <div className="skeleton-card__media" />
          <div className="skeleton-card__body">
            <div className="skeleton-line w-40" />
            <div className="skeleton-line w-100" />
            <div className="skeleton-line w-80" />
          </div>
        </div>
      ))}
    </div>
  );
}
