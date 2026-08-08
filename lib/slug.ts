// URL slug の変換（URL規約は docs/02_architecture.md §6）
// slug は Data Dragon 英語IDの小文字（ハイフンを含まない）前提。

const ID_PATTERN = /^[a-z0-9]+$/;

export function isChampionSlug(value: string): boolean {
  return ID_PATTERN.test(value);
}

/** 通常レーン: `{me}-vs-{enemy}` */
export function buildLaneSlug(me: string, enemy: string): string {
  return `${me}-vs-${enemy}`;
}

export function parseLaneSlug(slug: string): { me: string; enemy: string } | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2) return null;
  const [me, enemy] = parts;
  if (!isChampionSlug(me) || !isChampionSlug(enemy)) return null;
  return { me, enemy };
}

// BOT: `{myAdc}-{mySup}-vs-{enAdc}-{enSup}` の buildBotSlug / parseBotSlug は T-1300 で削除した
// （docs/archive/bot/ui/lib/bot-fragments.ts に退避）。復活の判断は T-1308。
