import { Panel } from "@/components/ui/Panel";
import { StarRating } from "@/components/ui/StarRating";
import { WinRateBar } from "@/components/ui/WinRateBar";
import type { LaneMatchup } from "@/lib/types";

/** 評価パネル: AI評価（★5段階）+ 勝率ゲージ + 下部注記（06_ui §4.3） */
export function EvaluationPanel({
  aiRating,
  advantage,
  winRate,
  winRateNote,
  footnote,
}: {
  aiRating: LaneMatchup["aiRating"];
  advantage: string;
  winRate: number;
  winRateNote: string;
  footnote: string;
}) {
  return (
    <Panel className="flex flex-col justify-center gap-3 p-[18px] md:px-6">
      <div className="grid grid-cols-[1fr_1px_1.3fr] items-center gap-3 md:gap-[26px]">
        <div className="flex flex-col gap-[7px]">
          <span className="text-[11px] text-text-muted">AI評価</span>
          <StarRating rating={aiRating} label={advantage} />
        </div>
        <div className="h-full w-px bg-border-subtle" />
        <div className="flex flex-col gap-[7px]">
          <span className="text-[11px] text-text-muted">勝率（統計）</span>
          <WinRateBar value={winRate} note={winRateNote} />
        </div>
      </div>
      <p className="border-t border-border-subtle pt-2.5 text-[10.5px] leading-[1.6] text-text-faint">
        {footnote}
      </p>
    </Panel>
  );
}
