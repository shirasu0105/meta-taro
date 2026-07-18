"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** ヘッダー右端のCTA。LP（/）でのみ表示（サーバーレイアウトでは pathname を判定できないためクライアントで行う） */
export function HeaderCta() {
  const pathname = usePathname();
  if (pathname !== "/") return null;
  return (
    <Link
      href="/search"
      className="hidden rounded-[2px] bg-gold px-[18px] py-[9px] text-[12.5px] font-extrabold text-[#0A1428] sm:block"
    >
      対面を検索する
    </Link>
  );
}
