import Link from "next/link";
import { PatchBadge } from "@/components/ui/PatchBadge";
import { getMeta } from "@/lib/data";
import { HeaderCta } from "./HeaderCta";

/** 共通ヘッダー（06_ui §3）。CTAは LP（/）のみ HeaderCta が表示する */
export function SiteHeader() {
  const meta = getMeta();
  return (
    <header className="flex items-center gap-3.5 border-b border-border-subtle bg-bg-header px-4 py-3.5 md:px-8">
      <Link href="/" className="flex items-center gap-3.5">
        <span className="grid size-[27px] flex-none place-items-center rounded-[2px] border border-gold text-[13px] font-black text-gold">
          対
        </span>
        <span className="flex flex-col">
          <span className="text-[14px] font-black leading-[1.2] text-text-hi">
            Metaたろう
          </span>
          <span className="font-display text-[7.5px] tracking-[2.5px] text-gold">
            LOL MATCHUP COACH
          </span>
        </span>
      </Link>
      <nav className="ml-7 hidden gap-[22px] md:flex">
        <Link href="/#features" className="text-[12px] text-text-muted hover:text-text-hi">
          できること
        </Link>
        <Link href="/#howto" className="text-[12px] text-text-muted hover:text-text-hi">
          使い方
        </Link>
        <Link href="/glossary" className="text-[12px] text-text-muted hover:text-text-hi">
          用語集
        </Link>
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <PatchBadge patch={meta.patch} />
        <HeaderCta />
      </div>
    </header>
  );
}
