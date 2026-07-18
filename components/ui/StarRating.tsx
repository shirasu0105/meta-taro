/** AI評価の星5段階表示。label は「有利」等の advantage ラベル */
export function StarRating({ rating, label }: { rating: 1 | 2 | 3 | 4 | 5; label?: string }) {
  return (
    <div className="flex flex-col gap-[7px]">
      <div
        className="text-[24px] leading-none tracking-[2.5px]"
        role="img"
        aria-label={`AI評価: 5段階中${rating}`}
      >
        <span className="text-gold">{"★".repeat(rating)}</span>
        <span className="text-star-off">{"★".repeat(5 - rating)}</span>
      </div>
      {label && (
        <div className="text-[12.5px] font-extrabold text-gold">
          {label} <span className="font-medium text-text-faint">· 5段階中{rating}</span>
        </div>
      )}
    </div>
  );
}
