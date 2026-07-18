import Link from "next/link";

/** 用語チップ。用語集ページの該当アンカーへ遷移する（06_ui §3） */
export function GlossaryChip({ slug, term }: { slug: string; term: string }) {
  return (
    <Link
      href={`/glossary#${slug}`}
      className="rounded-[2px] border border-teal/35 px-[11px] py-1 text-[11px] text-teal hover:underline"
    >
      {term}
    </Link>
  );
}
