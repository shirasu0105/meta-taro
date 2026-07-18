/** セクション見出し: 日本語見出し + Cinzel英字マイクロラベル（06_ui §3） */
export function SectionHeading({ ja, en }: { ja: string; en: string }) {
  return (
    <div className="flex items-baseline gap-[9px]">
      <span className="text-[14px] font-bold text-text-hi">{ja}</span>
      <span className="font-display text-[8.5px] tracking-[2px] text-gold">{en}</span>
    </div>
  );
}
