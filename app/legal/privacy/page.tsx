import type { Metadata } from "next";
import { Panel } from "@/components/ui/Panel";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Metaたろう",
  description:
    "Metaたろうのプライバシーポリシーです。取得する情報・検索履歴の扱い・外部送信について説明します。",
};

const ESTABLISHED_DATE = "2026-07-20";

/** プライバシーポリシー（06_ui §3 フッターからの遷移先。T-803） */
export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-5 px-4 pb-11 pt-6 md:px-12 md:pt-[34px]">
      <div className="flex items-baseline gap-2.5">
        <h1 className="text-[15px] font-extrabold text-text-hi md:text-[20px]">
          プライバシーポリシー
        </h1>
        <span className="font-display text-[9px] tracking-[2.5px] text-gold">PRIVACY POLICY</span>
      </div>
      <Panel className="flex flex-col px-5 py-2 md:px-6">
        <section className="border-b border-border-subtle py-4">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">基本方針</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            shirasu（以下「運営者」）は、League of
            Legends対面アドバイスサービス「Metaたろう」（以下「本サービス」）における利用者情報の取り扱いについて、本ポリシーを定めます。
          </p>
        </section>
        <section className="border-b border-border-subtle py-4">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">収集する情報</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            本サービスはアカウント登録を必要としません。氏名・メールアドレス等の個人情報を取得することはなく、
            運営者独自のCookieも発行しません。検索した対面の履歴は、利用者の端末内（ブラウザのlocalStorage）にのみ保存され、
            運営者のサーバーへ送信されることはありません。履歴はブラウザの設定からいつでも削除できます。
          </p>
        </section>
        <section className="border-b border-border-subtle py-4">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">アクセスログ</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            本サービスはVercel社のホスティングサービス上で運用されており、IPアドレス・アクセス日時などの技術的な情報が、
            同サービスの提供に必要な範囲でホスティング事業者側で処理されます。
          </p>
        </section>
        <section className="border-b border-border-subtle py-4">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">外部送信</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            チャンピオンアイコン等の画像は、Riot
            Games提供のData Dragon（外部CDN）から直接取得しており、その通信に伴いIPアドレス等の情報が同CDNへ送信されます。
          </p>
        </section>
        <section className="border-b border-border-subtle py-4">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">アクセス解析</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            現時点でアクセス解析ツールは導入していません。将来導入する場合は、本ポリシーを改定のうえ掲載します。
          </p>
        </section>
        <section className="py-4 last:border-b-0">
          <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">改定</h2>
          <p className="text-[12.5px] leading-[1.9] text-text-body">
            運営者は、必要と判断した場合、本ポリシーを改定することがあります。改定後の内容は、本ページに掲載した時点から効力を生じます。
          </p>
          <p className="mt-3 text-[10.5px] text-text-faint">
            制定日: {ESTABLISHED_DATE} · 運営者: shirasu
          </p>
        </section>
      </Panel>
    </main>
  );
}
