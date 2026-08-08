// docs/03_database.md §3 のスキーマ定義が正。独自型を追加しないこと。

export type Lane = "top" | "jg" | "mid";

export type Meta = {
  patch: string; // 例 "26.13"
  updatedAt: string; // 例 "2026-07-13"
};

export type Champion = {
  id: string; // slug（例 "ahri", "leesin"）
  ddragonId: string; // Data Dragon表記（例 "Ahri", "LeeSin"）画像URL用
  name: { ja: string; en: string };
  search: string[]; // 検索語: ひらがな・カタカナ・英語
  lanes: ("top" | "jg" | "mid" | "adc" | "sup")[]; // 適性レーン
};

export type DangerSkill = {
  slot: "P" | "Q" | "W" | "E" | "R";
  name: string;
  tag: string; // 例 "スタン起点" / "範囲" / "要警戒"
  description: string;
  icon: string; // Data Dragon spell画像ファイル名（例 "AnnieQ.png"）
};

export type SpikeMark = "◎" | "○" | "△";

export type PowerSpike = {
  me: { early: SpikeMark; mid: SpikeMark; late: SpikeMark };
  enemy: { early: SpikeMark; mid: SpikeMark; late: SpikeMark };
  note: string;
};

export type Item = { id: number; name: string }; // idはData Dragonアイテム番号

export type Recommended = {
  runes: { keystone: string; primary: string; secondary: string; icon: string };
  spells: string[]; // 例 ["SummonerFlash", "SummonerHeal"]（Data Dragon表記）
  build: {
    core: Item[];
    boots: Item;
    situational: { item: Item; reason: string }[];
  };
};

export type LaneMatchup = {
  lane: Lane;
  me: string; // champion id
  enemy: string;
  aiRating: 1 | 2 | 3 | 4 | 5; // AI総合評価（星5段階で表示）
  advantage: string; // 表示ラベル: "有利" | "五分" | "不利" 等
  winRate?: number; // me視点の統計勝率（例 52.4）。統計ソース未整備のため
  // Phase 1 では生成も表示もしない（09_data_pipeline §2）
  summary: string; // 30秒要約
  gamePlan: { early: string; mid: string; late: string };
  dangerSkills: DangerSkill[];
  powerSpike: PowerSpike;
  recommended: Recommended;
  glossaryRefs: string[]; // 用語集slug
};

// BOT（2v2）の BotViewAdvice / BotMatchup は T-1300 で削除した。
// 型定義は docs/03_database.md §3.1（アーカイブ）にあり、復活の判断は T-1308。

export type GlossaryEntry = {
  slug: string; // 例 "all-in"
  term: string; // 例 "オールイン"
  description: string;
};
