export function LoadingBlock({ label = 'Loading…' }) {
  return (
    <div className="state-block">
      <div className="spinner" role="status" aria-label={label} />
    </div>
  );
}

export function ErrorBlock({ message = "Something went wrong loading this page.", onRetry }) {
  return (
    <div className="state-block">
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-outline" onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}

export function EmptyBlock({ message = 'Nothing here yet — check back soon.' }) {
  return (
    <div className="state-block">
      <p>{message}</p>
    </div>
  );
}
