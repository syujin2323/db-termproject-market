import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "중고마켓",
  description: "데이터베이스 텀 프로젝트 — 중고거래 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* 한글 폰트 Pretendard (동적 서브셋, 가변 폰트) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendard-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 w-full">{children}</main>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
