/**
 * JSON-LD 構造化データの埋め込み。実行コードではないため next/script ではなく
 * 素の script タグを使う（Next.js JSON-LD ガイド準拠）。
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // XSS対策: JSON.stringify は "<" をエスケープしないため unicode に置換
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
