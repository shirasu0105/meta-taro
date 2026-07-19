import Link from "next/link";
import { Panel } from "@/components/ui/Panel";

/** データなし表示（06_ui §4.6）。対面ページと同レイアウト内に表示する */
export function NoDataPanel() {
  return (
    <Panel className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <p className="text-[16px] font-extrabold text-text-hi">データがありません</p>
      <p className="text-[12px] leading-[1.9] text-text-muted">
        この対面のアドバイスはまだ用意できていません。
        <br />
        パッチ更新でデータが追加されることがあります。
      </p>
      <Link
        href="/search"
        className="mt-1.5 rounded-[2px] bg-gold px-[34px] py-3 text-[13px] font-extrabold text-bg"
      >
        対面を検索する
      </Link>
    </Panel>
  );
}
