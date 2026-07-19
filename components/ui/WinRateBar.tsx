/** 勝率表示: teal大数字 + ゲージバー + 注記（06_ui §3） */
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
