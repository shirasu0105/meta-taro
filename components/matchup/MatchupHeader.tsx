import Link from "next/link";
import type { Meta } from "@/lib/types";

/** 結果ページ上部: パンくず + タイトル + レーンバッジ + パッチ表記（06_ui §4.3） */
export function MatchupHeader({ badge, meta }: { badge: string; meta: Meta }) {
  const updated = meta.updatedAt.replaceAll("-", "/");
  const updatedShort = updated.slice(5); // "07/13"（モバイル短縮表記。06_ui §4.3 / D-2）

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/search"
        className="whitespace-nowrap text-[12px] text-text-muted hover:text-text-hi"
      >
        <span aria-hidden="true">‹</span>
        <span className="hidden md:inline"> 検索に戻る</span>
        <span className="sr-only md:hidden">検索に戻る</span>
      </Link>
      <h1 className="whitespace-nowrap text-[15px] font-extrabold text-text-hi md:text-[20px]">
        対面結果
      </h1>
      <span className="whitespace-nowrap rounded-[2px] border border-gold/50 px-[9px] py-[3px] text-[10.5px] font-extrabold text-gold">
        {badge}
      </span>
      {/* モバイル: 折り返し防止のため短縮表記（Patch省略・日付MM/DDのみ） */}
      <span className="ml-auto whitespace-nowrap font-mono text-[10px] text-text-faint md:hidden">
        {meta.patch} · JP · {updatedShort}更新
      </span>
      <span className="ml-auto hidden whitespace-nowrap font-mono text-[10px] text-text-faint md:block">
        Patch {meta.patch} · JP · {updated} 更新
      </span>
    </div>
  );
}
