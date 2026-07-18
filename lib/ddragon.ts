// Data Dragon 画像URLの組み立て（docs/04_api.md §4）
// バージョンは meta.json のパッチ番号とは独立に定数管理する。

export const DDRAGON_VERSION = "14.24.1";

const CDN = "https://ddragon.leagueoflegends.com/cdn";

/** チャンピオンアイコン（ddragonId は "Ahri" / "LeeSin" 等の表記） */
export function championIconUrl(ddragonId: string): string {
  return `${CDN}/${DDRAGON_VERSION}/img/champion/${ddragonId}.png`;
}

/** スキルアイコン（DangerSkill.icon のファイル名。例 "AnnieQ.png"） */
export function spellIconUrl(iconFile: string): string {
  return `${CDN}/${DDRAGON_VERSION}/img/spell/${iconFile}`;
}

/** サモナースペル（例 "SummonerFlash"） */
export function summonerSpellUrl(spellId: string): string {
  return `${CDN}/${DDRAGON_VERSION}/img/spell/${spellId}.png`;
}

/** アイテム（Data Dragon アイテム番号） */
export function itemIconUrl(itemId: number): string {
  return `${CDN}/${DDRAGON_VERSION}/img/item/${itemId}.png`;
}

/** ルーン（icon は "perk-images/..." のフルパス。バージョン無しURL） */
export function runeIconUrl(iconPath: string): string {
  return `${CDN}/img/${iconPath}`;
}

/** スプラッシュアート（バージョン無しURL） */
export function splashUrl(ddragonId: string): string {
  return `${CDN}/img/champion/splash/${ddragonId}_0.jpg`;
}
