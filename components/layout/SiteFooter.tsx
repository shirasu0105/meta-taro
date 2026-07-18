import { getMeta } from "@/lib/data";

/** 共通フッター（06_ui §3） */
export function SiteFooter() {
  const meta = getMeta();
  const updated = meta.updatedAt.replaceAll("-", "/");
  return (
    <footer className="mt-auto flex flex-col gap-3 border-t border-border-subtle px-6 py-[18px] md:flex-row md:items-center md:gap-[18px] md:px-12">
      <nav className="flex gap-4">
        {/* 規約系ページは未実装のためプレースホルダ（対象ページ実装時に href を差し替える） */}
        <a href="#" className="text-[10.5px] text-text-muted hover:text-text-hi">
          利用規約
        </a>
        <a href="#" className="text-[10.5px] text-text-muted hover:text-text-hi">
          プライバシーポリシー
        </a>
        <a href="#" className="text-[10.5px] text-text-muted hover:text-text-hi">
          免責事項
        </a>
      </nav>
      <p className="text-[9.5px] leading-[1.7] text-text-faint md:ml-auto md:text-right">
        本サービスはRiot Games公式ではありません。AI・統計情報は参考情報であり、勝利を保証するものではありません。
        <br />
        Patch {meta.patch} · JP · {updated} 更新 · アイコン: Data Dragon
      </p>
    </footer>
  );
}
