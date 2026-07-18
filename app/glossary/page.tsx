import type { Metadata } from "next";
import { Panel } from "@/components/ui/Panel";
import { getGlossary } from "@/lib/data";

export const metadata: Metadata = {
  title: "用語集 | Metaたろう",
  description:
    "対面アドバイスに登場するLoL用語（オールイン・ポーク・スケール等）の意味を解説します。",
};

/** 用語集（06_ui §4.5）。各用語に id アンカーを持ち、結果画面の用語チップから遷移する */
export default function GlossaryPage() {
  const glossary = getGlossary();
  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-5 px-4 pb-11 pt-6 md:px-12 md:pt-[34px]">
      <div className="flex items-baseline gap-2.5">
        <h1 className="text-[15px] font-extrabold text-text-hi md:text-[20px]">用語集</h1>
        <span className="font-display text-[9px] tracking-[2.5px] text-gold">GLOSSARY</span>
      </div>
      <Panel className="flex flex-col px-5 py-2 md:px-6">
        {glossary.map((entry) => (
          <section
            key={entry.slug}
            id={entry.slug}
            className="scroll-mt-6 border-b border-border-subtle py-4 last:border-b-0"
          >
            <h2 className="mb-1.5 text-[14px] font-bold text-text-hi">{entry.term}</h2>
            <p className="text-[12.5px] leading-[1.9] text-text-body">{entry.description}</p>
          </section>
        ))}
      </Panel>
    </main>
  );
}
