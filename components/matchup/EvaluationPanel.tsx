import { Panel } from "@/components/ui/Panel";
import { StarRating } from "@/components/ui/StarRating";
import { WinRateBar } from "@/components/ui/WinRateBar";
import type { LaneMatchup } from "@/lib/types";

/**
 * 評価パネル（06_ui §4.3）。
 * Phase 1: 左=AI評価 / 縦区切り / 右=注記。390pxでも3列グリッドで横並びを維持する。
 * Phase 2: `winRate` が渡された場合のみ右列を勝率ゲージへ差し替え、注記をパネル下部へ移す。
 */
export function EvaluationPanel({
  aiRating,
  advantage,
  note,
  winRate,
  winRateNote,
}: {
  aiRating: LaneMatchup["aiRating"];
  advantage: string;
  /** Phase 1 は右列、Phase 2（winRate あり）はパネル下部に表示する注記 */
  note: string;
  winRate?: number;
  winRateNote?: string;
}) {
  return (
    // justify-center: PCではVSパネル側が行高を決めるため、引き伸ばし時に中身を中央保持する
    <Panel className="flex flex-col justify-center gap-3 p-[18px] md:px-6">
      <div className="grid grid-cols-[1fr_1px_1.3fr] items-center gap-3 md:gap-[26px]">
        <div className="flex flex-col gap-[7px]">
          <span className="text-[11px] text-text-muted">AI評価</span>
          <StarRating rating={aiRating} label={advantage} />
        </div>
        <div className="h-full w-px bg-border-subtle" />
        {winRate === undefined ? (
          <p className="text-[10.5px] leading-[1.6] text-text-faint">{note}</p>
        ) : (
          <div className="flex flex-col gap-[7px]">
            <span className="text-[11px] text-text-muted">勝率（統計）</span>
            <WinRateBar value={winRate} note={winRateNote} />
          </div>
        )}
      </div>
      {winRate !== undefined && (
        <p className="border-t border-border-subtle pt-2.5 text-[10.5px] leading-[1.6] text-text-faint">
          {note}
        </p>
      )}
    </Panel>
  );
}
