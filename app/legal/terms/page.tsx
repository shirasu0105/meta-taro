import type { Metadata } from "next";
import { Panel } from "@/components/ui/Panel";

export const metadata: Metadata = {
  title: "利用規約 | Metaたろう",
  description: "Metaたろうの利用規約です。サービス内容・禁止事項・免責事項・準拠法について定めています。",
};

const ESTABLISHED_DATE = "2026-07-20";

/** 利用規約（06_ui §3 フッターからの遷移先。T-803） */
export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-5 px-4 pb-11 pt-6 md:px-12 md:pt-[34px]">
      <div className="flex items-baseline gap-2.5">
        <h1 className="text-[15px] font-extrabold text-text-hi md:text-[20px]">利用規約</h1>
        <span className="font-display text-[9px] tracking-[2.5px] text-gold">TERMS OF SERVICE</span>
      </div>
      <Panel className="flex flex-col px-5 py-2 md:px-6">
        <section className="border-b border-border-subtle py-4">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">第1条（適用）</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            本規約は、shirasu（以下「運営者」）が提供するLeague
            of Legends対面アドバイスサービス「Metaたろう」（以下「本サービス」）の利用条件を定めるものです。
            利用者は、本サービスを利用した時点で本規約に同意したものとみなします。
          </p>
        </section>
        <section className="border-b border-border-subtle py-4">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">第2条（サービス内容）</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            本サービスは、チャンピオン対面に関するAI生成アドバイスを無料・アカウント登録不要で提供します。
            表示内容は生成AIによる参考情報であり、統計的な勝率データではありません。
            運営者は、利用者への事前の通知なく、本サービスの内容を変更し、または提供を停止することがあります。
          </p>
        </section>
        <section className="border-b border-border-subtle py-4">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">第3条（知的財産権）</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            本サービスで表示するチャンピオン名・アイコン等のLeague of
            Legends関連の名称・画像は、Riot Games, Inc.
            に帰属します。本サービスはRiot
            Games公式のファンコンテンツポリシーに基づく非公式のファンコンテンツであり、Riot
            Gamesの承認・後援を受けたものではありません。
          </p>
        </section>
        <section className="border-b border-border-subtle py-4">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">第4条（禁止事項）</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            利用者は、本サービスの利用にあたり、法令に違反する行為、本サービスの運営を妨げる行為、
            不正アクセスを試みる行為、その他運営者が不適切と判断する行為を行ってはなりません。
          </p>
        </section>
        <section className="border-b border-border-subtle py-4">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">第5条（免責事項）</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            本サービスの内容に関する免責事項は、
            <a href="/legal/disclaimer" className="text-teal hover:underline">
              免責事項ページ
            </a>
            に定めるとおりです。
          </p>
        </section>
        <section className="border-b border-border-subtle py-4">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">第6条（規約の変更）</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            運営者は、必要と判断した場合、利用者への事前の通知なく本規約を変更できるものとします。
            変更後の規約は、本ページに掲載した時点から効力を生じます。
          </p>
        </section>
        <section className="py-4 last:border-b-0">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">第7条（準拠法）</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            本規約の解釈にあたっては、日本法を準拠法とします。
          </p>
          <p className="mt-3 text-[10.5px] text-text-faint">
            制定日: {ESTABLISHED_DATE} · 運営者: shirasu
          </p>
        </section>
      </Panel>
    </main>
  );
}
