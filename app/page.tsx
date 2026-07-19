import Image from "next/image";
import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { getChampion } from "@/lib/champions";
import { getLaneMatchup } from "@/lib/data";
import { splashUrl } from "@/lib/ddragon";

const FEATURES = [
  {
    no: "01",
    title: "AI評価を5段階で先に",
    description: "5段階のAI総合評価を最上部に。判断は3秒で。",
  },
  {
    no: "02",
    title: "危険スキルとパワースパイク",
    description: "「食らってはいけない技」と強い時間帯だけを要点で。",
  },
  {
    no: "03",
    title: "ルーン・スペル・ビルド推奨",
    description: "対面を踏まえた推奨セットをそのまま採用できます。",
  },
];

const HOW_TO = [
  { no: "1", title: "レーンを選ぶ", description: "TOP / JG / MID、またはBOT（2v2）" },
  { no: "2", title: "チャンピオンを入力", description: "テキスト検索＋候補から選択" },
  { no: "3", title: "結果を見る", description: "評価・立ち回り・ビルドを30秒で確認" },
];

/** LP（06_ui §4.1）。プレビューカードはモック mid/ahri-vs-annie の実データを表示する */
export default function Home() {
  const preview = getLaneMatchup("mid", "ahri", "annie");
  const ahri = getChampion("ahri");
  const annie = getChampion("annie");

  return (
    <main className="flex flex-1 flex-col">
      {/* ヒーロー */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 md:left-auto md:right-0 md:w-[64%]">
          <Image
            src={splashUrl("Ahri")}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 64vw, 100vw"
            className="object-cover object-top opacity-55 md:object-[center_22%] md:opacity-100"
          />
        </div>
        <div
          className="absolute inset-0 md:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,20,40,.3) 0%, rgba(10,20,40,.78) 55%, #0A1428 100%)",
          }}
        />
        <div
          className="absolute inset-0 hidden md:block"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,20,40,.1) 55%, #0A1428 100%), linear-gradient(90deg, #0A1428 33%, rgba(10,20,40,.9) 50%, rgba(10,20,40,.3) 78%, rgba(10,20,40,.6) 100%)",
          }}
        />
        <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-8 px-4 pb-8 pt-8 md:grid-cols-[1fr_420px] md:gap-14 md:px-12 md:pb-[68px] md:pt-[60px]">
          <div className="flex flex-col gap-3.5">
            <p className="font-display text-[9px] tracking-[3px] text-gold md:text-[10px] md:tracking-[3.5px]">
              AI MATCHUP ADVICE
            </p>
            <h1 className="text-[25px] font-black leading-[1.45] text-text-hi md:text-[40px] md:leading-[1.4]">
              ロード画面の30秒で、
              <br />
              対面がわかる。
            </h1>
            <p className="max-w-[520px] text-[12.5px] leading-[1.9] text-text-body md:text-[14px] md:leading-[2]">
              チャンピオン確定からロード完了までの短い時間で、AIが対面の要点だけを要約。ゴールド〜プラチナ帯の「知らなくて負けた」をなくします。
            </p>
            <div className="mt-1.5 flex flex-col items-center gap-2.5 md:flex-row md:items-center md:gap-4">
              <Link
                href="/search"
                className="block w-full rounded-[2px] bg-gold px-[34px] py-[15px] text-center text-[14px] font-extrabold text-bg md:w-auto md:text-[14.5px]"
              >
                対面を検索する
              </Link>
              <span className="text-[10px] text-text-muted md:text-[11px]">
                無料 · 登録不要 · 毎週パッチごとに更新
              </span>
            </div>
          </div>

          {/* 結果画面プレビューカード */}
          {preview && ahri && annie && (
            <div className="flex flex-col gap-3 rounded-[2px] border border-border bg-panel/90 p-[18px]">
              <p className="text-[10.5px] tracking-[.5px] text-text-muted">
                結果画面プレビュー — MID アーリ vs アニー
              </p>
              <div className="flex items-center gap-3">
                <ChampionIcon ddragonId={ahri.ddragonId} name={ahri.name.ja} side="me" size={44} />
                <span className="font-display text-[12px] text-gold">VS</span>
                <ChampionIcon ddragonId={annie.ddragonId} name={annie.name.ja} side="enemy" size={44} />
                <div className="ml-auto text-right">
                  <p
                    className="text-[14px] leading-none tracking-[1.5px]"
                    role="img"
                    aria-label={`AI評価: 5段階中${preview.aiRating}`}
                  >
                    <span className="text-gold">{"★".repeat(preview.aiRating)}</span>
                    <span className="text-star-off">{"★".repeat(5 - preview.aiRating)}</span>
                  </p>
                  <p className="mt-[3px] text-[12.5px] font-extrabold leading-none text-gold">
                    {preview.advantage}
                    <span className="text-[10px] font-medium text-text-muted">
                      {" "}
                      · 5段階中{preview.aiRating}
                    </span>
                  </p>
                </div>
              </div>
              <p className="line-clamp-3 border-t border-border-subtle pt-2.5 text-[11.5px] leading-[1.8] text-text-body">
                {preview.summary}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* できること FEATURES */}
      <section
        id="features"
        className="mx-auto flex w-full max-w-[1180px] scroll-mt-6 flex-col gap-4 px-4 pt-9 md:px-12"
      >
        <h2 className="flex items-baseline gap-2.5">
          <span className="text-[13.5px] font-extrabold text-text-hi md:text-[16px]">
            できること
          </span>
          <span className="font-display text-[8.5px] tracking-[2px] text-gold md:text-[9px] md:tracking-[2.5px]">
            FEATURES
          </span>
        </h2>
        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.no}
              className="flex items-start gap-3 rounded-[2px] md:flex-col md:gap-[9px] md:border md:border-border md:bg-panel md:p-[18px]"
            >
              <span className="w-fit rounded-[2px] border border-gold-border px-2 py-1.5 font-display text-[11px] leading-none text-gold md:text-[12px]">
                {f.no}
              </span>
              <div>
                <h3 className="mb-[3px] text-[13px] font-bold text-text-hi md:text-[14px]">
                  {f.title}
                </h3>
                <p className="text-[11.5px] leading-[1.8] text-text-muted md:text-[12px]">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 使い方 HOW TO */}
      <section
        id="howto"
        className="mx-auto flex w-full max-w-[1180px] scroll-mt-6 flex-col gap-4 px-4 pb-10 pt-8 md:px-12"
      >
        <h2 className="flex items-baseline gap-2.5">
          <span className="text-[13.5px] font-extrabold text-text-hi md:text-[16px]">使い方</span>
          <span className="font-display text-[8.5px] tracking-[2px] text-gold md:text-[9px] md:tracking-[2.5px]">
            HOW TO
          </span>
        </h2>
        <div className="flex gap-2 md:gap-4">
          {HOW_TO.map((step) => (
            <div
              key={step.no}
              className="flex flex-1 flex-col items-start gap-1.5 rounded-[2px] border border-border bg-panel p-3 md:flex-row md:gap-3.5 md:px-[18px] md:py-4"
            >
              <span className="font-display text-[11px] leading-[1.2] text-gold md:text-[15px]">
                {step.no}
              </span>
              <div>
                <h3 className="text-[11.5px] font-bold leading-[1.5] text-text-hi md:mb-[3px] md:text-[13px]">
                  {step.title}
                </h3>
                <p className="hidden text-[11.5px] leading-[1.7] text-text-muted md:block">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
