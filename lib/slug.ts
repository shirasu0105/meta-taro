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

/** BOT: `{myAdc}-{mySup}-vs-{enAdc}-{enSup}` */
export function buildBotSlug(
  myAdc: string,
  mySup: string,
  enemyAdc: string,
  enemySup: string,
): string {
  return `${myAdc}-${mySup}-vs-${enemyAdc}-${enemySup}`;
}

export function parseBotSlug(
  slug: string,
): { myAdc: string; mySup: string; enemyAdc: string; enemySup: string } | null {
  const sides = slug.split("-vs-");
  if (sides.length !== 2) return null;
  const mine = sides[0].split("-");
  const theirs = sides[1].split("-");
  if (mine.length !== 2 || theirs.length !== 2) return null;
  const [myAdc, mySup] = mine;
  const [enemyAdc, enemySup] = theirs;
  if (![myAdc, mySup, enemyAdc, enemySup].every(isChampionSlug)) return null;
  return { myAdc, mySup, enemyAdc, enemySup };
}
