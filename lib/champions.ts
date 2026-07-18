// チャンピオンマスタ。静的 JSON import のためクライアントコンポーネントからも使える。
import championsJson from "@/data/champions.json";
import type { Champion } from "@/lib/types";

// union 型（lanes）は JSON のリテラル型と互換がないため、キャストはここに集約する。
const champions = championsJson as Champion[];

export function getChampions(): Champion[] {
  return champions;
}

export function getChampion(id: string): Champion | undefined {
  return champions.find((c) => c.id === id);
}
