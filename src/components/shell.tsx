"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const nav = [
  ["/", "▦", "ボード"],
  ["/claims", "▤", "クレーム"],
  ["/actions", "☑", "対策ボード"],
  ["/trends", "▥", "傾向"],
  ["/settings", "⚙", "設定"],
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">葉</span>
          <span>
            こもれび<span className="brand-sub">QUALITY MANAGEMENT</span>
          </span>
        </Link>
        <div className="workspace">
          こもれび菓子工房<span>品質改善ワークスペース</span>
        </div>
        <nav aria-label="メインナビゲーション">
          {nav.map(([href, icon, label]) => (
            <Link
              key={href}
              href={href}
              className={(href === "/" ? path === href : path.startsWith(href)) ? "active" : ""}
            >
              <span aria-hidden>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="live-dot" /> ブラウザ内に保存
          <Link href="/about">ⓘ このデモについて</Link>
          <small>こもれび菓子工房（架空）</small>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>クレーム再発防止ボード</span>
          <span className="demo-badge">デモ用の架空データです</span>
          <Link className="avatar" href="/about" aria-label="このデモについて">
            こ
          </Link>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
