import type { Metadata } from "next";
import { Cinzel, Noto_Sans_JP } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Metaたろう | LoL対面AIアドバイス",
  description:
    "チャンピオン選択〜ロード画面の短時間で、対面の立ち回り・注意スキル・ビルドをAIアドバイスで確認できるサービス。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJp.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg font-sans text-text-body">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
