import Link from "next/link";
import type { GlossaryEntry } from "@/lib/types";

/**
 * 本文中の用語を /glossary#slug への teal リンクに置換する（06_ui §6）。
 * 最長一致優先・全出現をリンク化。refs は対面データの glossaryRefs で絞った用語のみ渡す。
 */
export function GlossaryText({ text, refs }: { text: string; refs: GlossaryEntry[] }) {
  const terms = [...refs].sort((a, b) => b.term.length - a.term.length);
  const nodes: React.ReactNode[] = [];
  let rest = text;
  let key = 0;

  while (rest !== "") {
    let best: { index: number; entry: GlossaryEntry } | null = null;
    for (const entry of terms) {
      const index = rest.indexOf(entry.term);
      // 同位置なら先に見つけた（=より長い）用語を優先する
      if (index !== -1 && (best === null || index < best.index)) {
        best = { index, entry };
      }
    }
    if (best === null) {
      nodes.push(rest);
      break;
    }
    if (best.index > 0) nodes.push(rest.slice(0, best.index));
    nodes.push(
      <Link
        key={key++}
        href={`/glossary#${best.entry.slug}`}
        className="text-teal underline underline-offset-2"
      >
        {best.entry.term}
      </Link>,
    );
    rest = rest.slice(best.index + best.entry.term.length);
  }

  return <>{nodes}</>;
}
