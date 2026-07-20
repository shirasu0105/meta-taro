import type { Metadata } from "next";
import { Panel } from "@/components/ui/Panel";

export const metadata: Metadata = {
  title: "免責事項 | Metaたろう",
  description: "Metaたろうの免責事項です。AI生成情報の性質・データの正確性・Riot Games非公式である旨を説明します。",
};

const ESTABLISHED_DATE = "2026-07-20";

/** 免責事項（06_ui §3 フッターからの遷移先。T-803） */
export default function DisclaimerPage() {
  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-5 px-4 pb-11 pt-6 md:px-12 md:pt-[34px]">
      <div className="flex items-baseline gap-2.5">
        <h1 className="text-[15px] font-extrabold text-text-hi md:text-[20px]">免責事項</h1>
        <span className="font-display text-[9px] tracking-[2.5px] text-gold">DISCLAIMER</span>
      </div>
      <Panel className="flex flex-col px-5 py-2 md:px-6">
        <section className="border-b border-border-subtle py-4">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">AI生成情報について</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            本サービスが表示するアドバイス・評価は生成AIによる参考情報であり、対戦の勝利を保証するものではありません。
            実際のプレイ判断は、利用者ご自身の責任で行ってください。
          </p>
        </section>
        <section className="border-b border-border-subtle py-4">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">データの正確性</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            対面データはパッチごとに週次で更新していますが、最新パッチの内容を完全に反映していない場合があります。
            運営者は、掲載内容の正確性・完全性・最新性についていかなる保証も行いません。
          </p>
        </section>
        <section className="border-b border-border-subtle py-4">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">Riot Gamesとの関係</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            MetaたろうはRiot
            Gamesの承認・後援を受けていません。League of
            LegendsおよびRiot GamesはRiot
            Games, Inc.
            の商標または登録商標です。本サービスはRiot
            Games公式のファンコンテンツポリシーに基づく非公式のファンコンテンツです。
          </p>
        </section>
        <section className="border-b border-border-subtle py-4">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">損害の免責</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            運営者は、本サービスの利用または利用不能により利用者に生じたいかなる損害についても、
            運営者の故意または重過失による場合を除き、責任を負いません。
          </p>
        </section>
        <section className="py-4 last:border-b-0">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">外部リンク</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            本サービスから外部サイトへリンクする場合がありますが、リンク先の内容について運営者は責任を負いません。
          </p>
          <p className="mt-3 text-[10.5px] text-text-faint">
            制定日: {ESTABLISHED_DATE} · 運営者: shirasu
          </p>
        </section>
      </Panel>
    </main>
  );
}
