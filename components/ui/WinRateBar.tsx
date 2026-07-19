/**
 * 勝率表示: teal大数字 + ゲージバー + 注記（06_ui §3）。
 *
 * **Phase 1 では未使用（描画されない）。** 統計ソースが未確定のまま勝率を出すと
 * AI生成値を統計値として提示することになるため（09_data_pipeline §2 / 06_ui §7）。
 * 復活条件: 統計ソース確定 → `winRate` をデータに投入すれば
 * `EvaluationPanel` の分岐（`winRate !== undefined`）が自動的に本コンポーネントを描画する。
 * そのため本ファイルは削除せず温存すること。
 */
export function WinRateBar({ value, note }: { value: number; note?: string }) {
  return (
    <div className="flex flex-col gap-[7px]">
      <div className="text-[28px] font-black leading-none text-teal md:text-[34px]">
        {value}
        <span className="text-[14px] md:text-[16px]">%</span>
      </div>
      <div className="h-[6px] rounded-[2px] bg-inset">
        <div
          className="h-full rounded-[2px] bg-teal"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {note && <div className="text-[10px] text-text-faint">{note}</div>}
    </div>
  );
}
