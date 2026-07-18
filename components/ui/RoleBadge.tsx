/** 役割バッジ:「あなた」「自チーム」「ADC」= ally(teal) /「相手」「敵チーム」= enemy(danger) */
export function RoleBadge({
  tone,
  children,
}: {
  tone: "ally" | "enemy";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "ally" ? "border-teal/40 text-teal" : "border-danger/40 text-danger";
  return (
    <span
      className={`whitespace-nowrap rounded-[2px] border px-[7px] py-px text-[9px] font-extrabold ${toneClass}`}
    >
      {children}
    </span>
  );
}
