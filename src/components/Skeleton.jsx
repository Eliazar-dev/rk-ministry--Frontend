export function SkeletonCard() {
  return (
    <div className="skel-card" aria-hidden="true">
      <div className="skel skel-img" />
      <div className="skel-lines">
        <div className="skel skel-line w80" />
        <div className="skel skel-line w60" />
        <div className="skel skel-line w40" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
