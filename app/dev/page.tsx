// ============================================================
// 開発検証用の一時ページ（T-104/T-105/T-106 の完了条件確認）。
// T-201（LP実装）着手時に削除すること。sitemap には含めない。
// ============================================================
import Image from "next/image";
import { getChampion, getChampions } from "@/lib/champions";
import {
  getBotMatchup,
  getGlossary,
  getLaneMatchup,
  getMeta,
  listBotMatchups,
  listLaneMatchups,
} from "@/lib/data";
import { championIconUrl, itemIconUrl, runeIconUrl, spellIconUrl, summonerSpellUrl } from "@/lib/ddragon";
import { buildBotSlug, buildLaneSlug } from "@/lib/slug";
import { searchChampions } from "@/lib/search";

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={ok ? "text-teal" : "text-danger"}>
      {ok ? "OK" : "NG"} — {label}
    </li>
  );
}

export default function DevPage() {
  const meta = getMeta();
  const champions = getChampions();
  const glossary = getGlossary();
  const laneMatchups = listLaneMatchups();
  const botMatchups = listBotMatchups();

  const loadedLanes = laneMatchups.map((m) => ({
    slug: `${m.lane}/${buildLaneSlug(m.me, m.enemy)}`,
    data: getLaneMatchup(m.lane, m.me, m.enemy),
  }));
  const loadedBots = botMatchups.map((m) => ({
    slug: `bot/${buildBotSlug(m.myAdc, m.mySup, m.enemyAdc, m.enemySup)}`,
    data: getBotMatchup(m.myAdc, m.mySup, m.enemyAdc, m.enemySup),
  }));

  const noData = getLaneMatchup("mid", "yasuo", "zed");
  const searchHit = searchChampions("あー");
  const searchLane = searchChampions("l", "jg");
  const ahri = getChampion("ahri");
  const annieMatch = getLaneMatchup("mid", "ahri", "annie");

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-6 py-10">
      <h1 className="text-xl font-bold text-text-hi">/dev — P1 検証ページ（T-201 で削除）</h1>

      <section>
        <h2 className="mb-2 font-bold text-text-hi">データアクセス層（T-104 / T-105）</h2>
        <ul className="flex flex-col gap-1 text-sm">
          <Check ok={meta.patch === "26.13"} label={`getMeta: patch=${meta.patch} updatedAt=${meta.updatedAt}`} />
          <Check ok={champions.length >= 15} label={`getChampions: ${champions.length}体`} />
          <Check ok={glossary.length >= 10} label={`getGlossary: ${glossary.length}語`} />
          <Check ok={laneMatchups.length === 6} label={`listLaneMatchups: ${laneMatchups.length}件`} />
          <Check ok={botMatchups.length === 2} label={`listBotMatchups: ${botMatchups.length}件`} />
          {loadedLanes.map((m) => (
            <Check
              key={m.slug}
              ok={m.data !== null}
              label={`getLaneMatchup ${m.slug}: ${m.data ? `${m.data.advantage} ★${m.data.aiRating} ${m.data.winRate}%` : "読込失敗"}`}
            />
          ))}
          {loadedBots.map((m) => (
            <Check
              key={m.slug}
              ok={m.data !== null}
              label={`getBotMatchup ${m.slug}: ${m.data ? `${m.data.advantage} ★${m.data.aiRating} ${m.data.winRate}%（ADC/SUP視点あり）` : "読込失敗"}`}
            />
          ))}
          <Check ok={noData === null} label="getLaneMatchup mid/yasuo-vs-zed → null（データなし）" />
          <Check
            ok={searchHit.some((c) => c.id === "ahri")}
            label={`searchChampions("あー") → ${searchHit.map((c) => c.id).join(", ") || "0件"}`}
          />
          <Check
            ok={searchLane.every((c) => c.lanes.includes("jg")) && searchLane.some((c) => c.id === "leesin")}
            label={`searchChampions("l", "jg") → ${searchLane.map((c) => c.id).join(", ") || "0件"}`}
          />
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-bold text-text-hi">Data Dragon 画像（lib/ddragon.ts + remotePatterns）</h2>
        <div className="flex flex-wrap items-end gap-4">
          {ahri && (
            <Image src={championIconUrl(ahri.ddragonId)} alt={ahri.name.ja} width={64} height={64} className="rounded-[2px] border border-gold bg-icon-bg" />
          )}
          {annieMatch && (
            <>
              <Image src={spellIconUrl(annieMatch.dangerSkills[0].icon)} alt={annieMatch.dangerSkills[0].name} width={40} height={40} className="rounded-[2px] border border-border bg-icon-bg" />
              <Image src={runeIconUrl(annieMatch.recommended.runes.icon)} alt={annieMatch.recommended.runes.keystone} width={40} height={40} className="rounded-full border border-gold bg-icon-bg" />
              <Image src={summonerSpellUrl(annieMatch.recommended.spells[0])} alt="サモナースペル" width={40} height={40} className="rounded-[2px] border border-border bg-icon-bg" />
              <Image src={itemIconUrl(annieMatch.recommended.build.core[0].id)} alt={annieMatch.recommended.build.core[0].name} width={40} height={40} className="rounded-[2px] border border-border bg-icon-bg" />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
