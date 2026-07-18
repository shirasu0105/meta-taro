import Link from "next/link";
import type { Meta } from "@/lib/types";

/** 結果ページ上部: パンくず + タイトル + レーンバッジ + パッチ表記（06_ui §4.3） */
export function MatchupHeader({ badge, meta }: { badge: string; meta: Meta }) {
  return (
    <div className="flex items-center gap-3">
      <Link href="/search" className="text-[12px] text-text-muted hover:text-text-hi">
        ‹ 検索に戻る
      </Link>
      <h1 className="text-[15px] font-extrabold text-text-hi md:text-[20px]">対面結果</h1>
      <span className="rounded-[2px] border border-gold/50 px-[9px] py-[3px] text-[10.5px] font-extrabold text-gold">
        {badge}
      </span>
      <span className="ml-auto hidden font-mono text-[10px] text-text-faint md:block">
        Patch {meta.patch} · JP · {meta.updatedAt.replaceAll("-", "/")} 更新
      </span>
    </div>
  );
}
