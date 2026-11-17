import type { Metadata } from "next";
import { Provider } from "@/components/store";
import { Shell } from "@/components/shell";
import "./globals.css";
export const metadata: Metadata = {
  title: "クレーム再発防止ボード",
  description:
    "お客様の声を品質改善へ。原因分析・再発防止策・効果確認・類似クレームの傾向を管理する、こもれび菓子工房の架空デモ。",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <Shell>
          <Provider>{children}</Provider>
        </Shell>
      </body>
    </html>
  );
}
