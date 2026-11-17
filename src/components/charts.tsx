import type { Claim } from "@/lib/types";
import { monthly, pareto } from "@/lib/trends";
const colors = ["#335c50", "#6e9684", "#a4b8a1", "#c8a66b", "#7c91a4", "#ae8e99", "#c4c9c0"];
export function MonthlyChart({
  claims,
  start,
  end,
  categories,
}: {
  claims: Claim[];
  start: string;
  end: string;
  categories: string[];
}) {
  const rows = monthly(claims, start, end, categories);
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <section className="panel form-panel">
      <h2>月別クレーム件数</h2>
      <p className="muted">分類別の内訳から、変化をつかむ</p>
      <div className="monthly-chart" role="img" aria-label="月別・分類別の積み上げ棒グラフ">
        {rows.map((r) => (
          <div className="chart-column" key={r.month}>
            <span className="chart-total">{r.total}</span>
            <div className="stacked-bar">
              {r.counts.map((count, i) => (
                <div
                  key={i}
                  style={{
                    height: `${(count / max) * 160}px`,
                    background: colors[i % colors.length],
                  }}
                  title={`${r.month} ${categories[i]}：${count}件`}
                />
              ))}
            </div>
            <small>{r.month.slice(2).replace("-", "/")}</small>
          </div>
        ))}
      </div>
      <div className="legend">
        {categories.map((c, i) => (
          <span key={c}>
            <i style={{ background: colors[i % colors.length] }} />
            {c}
          </span>
        ))}
      </div>
      <details>
        <summary>集計値を表で見る</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>月</th>
                {categories.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month}>
                  <th>{r.month}</th>
                  {r.counts.map((n, i) => (
                    <td key={i}>{n}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
export function ParetoChart({ claims, field }: { claims: Claim[]; field: "ms" | "tags" }) {
  const rows = pareto(claims, field);
  const max = Math.max(1, ...rows.map((r) => r.count));
  const step = 100 / Math.max(1, rows.length);
  const points = rows.map((r, i) => `${(i + 0.5) * step},${100 - r.cumulative}`).join(" ");
  return (
    <section className="panel form-panel">
      <h2>{field === "ms" ? "4M分類" : "原因タグ"}のパレート図</h2>
      <p className="muted">棒：件数 ／ 線：累積割合（右軸 0〜100%）</p>
      {!rows.length ? (
        <p className="empty">集計対象の原因がありません。</p>
      ) : (
        <>
          <div className="pareto-chart">
            <div className="pareto-bars">
              {rows.map((r) => (
                <div key={r.name}>
                  <span>{r.count}</span>
                  <i style={{ height: `${(r.count / max) * 150}px` }} />
                </div>
              ))}
            </div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="原因件数の累積割合">
              <polyline
                points={points}
                fill="none"
                stroke="#b5823d"
                strokeWidth="1.4"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <span className="axis-top">100%</span>
            <span className="axis-bottom">0%</span>
          </div>
          <div className="pareto-labels">
            {rows.map((r) => (
              <span key={r.name}>
                {r.name}
                <small>{r.cumulative.toFixed(0)}%</small>
              </span>
            ))}
          </div>
          <details>
            <summary>集計値を表で見る</summary>
            <table>
              <thead>
                <tr>
                  <th>原因</th>
                  <th>件数</th>
                  <th>累積割合</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name}>
                    <th>{r.name}</th>
                    <td>{r.count}</td>
                    <td>{r.cumulative.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </section>
  );
}
