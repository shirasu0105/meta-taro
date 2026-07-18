export default function Home() {
  // LP本体は T-201（P2）で実装する。P1では暗背景トーンの確認用プレースホルダのみ。
  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col items-center justify-center gap-3 px-6 py-24">
      <p className="font-display text-[10px] tracking-[3px] text-gold">
        LOL MATCHUP COACH
      </p>
      <h1 className="text-2xl font-black text-text-hi">Metaたろう</h1>
      <p className="text-sm text-text-muted">
        LPは T-201（P2）で実装予定です。
      </p>
    </main>
  );
}
