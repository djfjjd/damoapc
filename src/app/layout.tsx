import type { Metadata } from "next";
import "./globals.css";
import "./dashboard.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "pretendard/dist/web/variable/pretendardvariable.css";

export const metadata: Metadata = {
  title: "FlowMoa — AI Automation, One Flow",
  description: "콘텐츠 제작부터 커머스 운영, 문서 정리까지 하나로 연결하는 AI 통합 자동화 플랫폼",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
