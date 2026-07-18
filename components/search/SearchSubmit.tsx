"use client";

import Link from "next/link";

/** 検索実行ボタン。href が null の間は無効表示（06_ui §4.2 / §6） */
export function SearchSubmit({
  href,
  enabledLabel,
  disabledLabel,
  note,
}: {
  href: string | null;
  enabledLabel: string;
  disabledLabel: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-[7px] md:flex-row md:gap-4">
      {href ? (
        <Link
          href={href}
          className="block w-full rounded-[2px] bg-gold px-[46px] py-[15px] text-center text-[14px] font-extrabold text-bg md:w-auto md:text-[14.5px]"
        >
          {enabledLabel}
        </Link>
      ) : (
        <div className="w-full rounded-[2px] bg-[#1B2A44] px-[46px] py-[15px] text-center text-[14px] font-extrabold text-[#7C8698] md:w-auto md:text-[14.5px]">
          {disabledLabel}
        </div>
      )}
      {note && <span className="text-[10px] text-text-faint md:text-[11px]">{note}</span>}
    </div>
  );
}
