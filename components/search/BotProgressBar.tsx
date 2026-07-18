"use client";

/** BOTタブの選択状況バー「n / 4」（06_ui §4.2） */
export function BotProgressBar({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-[2px] border border-border bg-panel px-4 py-3 md:flex-row md:items-center md:gap-3.5">
      <div className="flex flex-1 items-center gap-2.5 md:gap-3.5">
        <span className="whitespace-nowrap text-[11px] text-text-muted md:text-[12px]">
          選択状況
        </span>
        <div className="h-1 flex-1 bg-inset">
          <div
            className="h-full bg-gold transition-[width]"
            style={{ width: `${(count / 4) * 100}%` }}
          />
        </div>
        <span className="whitespace-nowrap text-[11px] font-extrabold text-gold md:text-[12px]">
          {count} / 4
        </span>
      </div>
      <span className="text-[9.5px] text-text-faint md:text-[10.5px]">
        4体すべて確定すると結果を表示（事前生成データ）
      </span>
    </div>
  );
}
