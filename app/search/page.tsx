import type { Metadata } from "next";
import Link from "next/link";
import { LaneSearchForm } from "@/components/search/LaneSearchForm";

export const metadata: Metadata = {
  title: "対面検索 | Metaたろう",
  description:
    "自分と相手のチャンピオンを選ぶだけで、対面のAI評価・立ち回り・注意スキル・推奨ビルドを表示します。",
};

/** 検索ページ（06_ui §4.2）。フォーム以下はクライアント状態のみの静的シェル。
 * BOTタブは T-1300 で削除した（旧タブUIは docs/archive/bot/ui/components/search/ に退避） */
export default function SearchPage() {
  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-5 px-4 pb-11 pt-6 md:px-12 md:pt-[34px]">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-[12px] text-text-muted hover:text-text-hi">
          ‹ ホーム
        </Link>
        <h1 className="text-[15px] font-extrabold text-text-hi md:text-[20px]">対面検索</h1>
      </div>
      <LaneSearchForm />
    </main>
  );
}
