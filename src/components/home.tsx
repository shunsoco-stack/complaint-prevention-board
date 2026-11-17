"use client";
import Link from "next/link";
import { useStore } from "./store";
import { Heading, ClaimList, Badge } from "./ui";
import { deadline } from "@/lib/actions";
import { monthsAgo } from "@/lib/dates";
export default function Home() {
  const { data, now } = useStore();
  const today = now.slice(0, 10);
  const pending = data.claims.filter((c) => c.status === "分析待ち");
  const actions = data.claims.flatMap((c) =>
    c.actions.filter((a) => a.status !== "完了").map((a) => ({ ...a, claim: c })),
  );
  const overdue = actions.filter((a) => a.due < today);
  const week = actions.filter(
    (a) => deadline(a.due, today).days >= 0 && deadline(a.due, today).days <= 7,
  );
  const effects = data.claims
    .filter((c) => c.status === "効果確認中")
    .sort((a, b) => a.effectDue.localeCompare(b.effectDue));
  const current = data.claims.filter((c) => c.received.startsWith(today.slice(0, 7))).length;
  const previous = data.claims.filter((c) =>
    c.received.startsWith(monthsAgo(today, 2).slice(0, 7)),
  ).length;
  const recent = [...data.claims].sort((a, b) => b.received.localeCompare(a.received));
  return (
    <>
      <Heading eyebrow="OVERVIEW" title="品質改善ボード" text="お客様の声を、次の品質につなげる。">
        <span className="date-label">{today} · 日本時間</span>
        <Link className="button primary" href="/claims/new">
          ＋ クレームを登録
        </Link>
      </Heading>
      <div className="intro-strip">
        <span className="intro-icon">↗</span>
        <div>
          <strong>対応のその先に、再発しない仕組みを。</strong>
          <span>原因分析 → 再発防止策 → 効果確認まで、改善の進み具合を確認しましょう。</span>
        </div>
        <span className="intro-label">継続的な品質改善</span>
      </div>
      <div className="stats-grid">
        {[
          ["分析待ち", pending.length, "原因の確認を始めましょう", "warning"],
          ["期限超過の対策", overdue.length, `7日以内の期限：${week.length}件`, "danger"],
          [
            "効果確認待ち",
            effects.length,
            `予定日超過：${effects.filter((c) => c.effectDue < today).length}件`,
            "teal",
          ],
          [
            "今月のクレーム",
            current,
            `前月 ${previous}件 ／ 前月比 ${current - previous > 0 ? "+" : ""}${current - previous}件`,
            "neutral",
          ],
        ].map(([title, count, note, tone]) => (
          <div className={`stat-card ${tone}`} key={title}>
            <div>
              {title}
              <span className="stat-icon">{title === "今月のクレーム" ? "▥" : "◷"}</span>
            </div>
            <strong>
              {count}
              <small>件</small>
            </strong>
            <p>{note}</p>
          </div>
        ))}
      </div>
      <div className="two-columns">
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <span className="dot danger" />
              優先して進める対策
            </h2>
            <Link href="/actions">すべて見る →</Link>
          </div>
          {[...overdue, ...week].map((a) => (
            <Link className="task-row" href={`/claims/${a.claim.id}`} key={a.id}>
              <div>
                <span className="mono">{a.claim.id}</span>
                <strong>{a.content}</strong>
                <small>
                  {a.owner} · 期限 {a.due}
                </small>
              </div>
              <Badge tone={deadline(a.due, today).tone}>{deadline(a.due, today).label}</Badge>
            </Link>
          ))}
          {!overdue.length && !week.length && (
            <p className="empty">直近の期限の対策はありません。</p>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <span className="dot teal" />
              効果を確かめる
            </h2>
            <span className="muted">予定日順</span>
          </div>
          {effects.map((c) => (
            <Link className="task-row" href={`/claims/${c.id}#effect`} key={c.id}>
              <div>
                <span className="mono">{c.id}</span>
                <strong>{c.product}</strong>
                <small>確認予定日 {c.effectDue}</small>
              </div>
              <Badge tone={c.effectDue < today ? "danger" : "teal"}>
                {c.effectDue < today ? "予定日超過" : "確認待ち"}
              </Badge>
            </Link>
          ))}
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>最近のクレーム</h2>
          <Link href="/claims">クレーム一覧へ →</Link>
        </div>
        <ClaimList claims={recent.slice(0, 5)} />
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>分析を待っているクレーム</h2>
          <Badge tone="warning">{pending.length}件</Badge>
        </div>
        <ClaimList claims={pending} />
      </section>
    </>
  );
}
