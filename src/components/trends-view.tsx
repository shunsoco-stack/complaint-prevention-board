"use client";
import { useState } from "react";
import { useStore } from "./store";
import { Heading, Select } from "./ui";
import { MonthlyChart, ParetoChart } from "./charts";
import { monthsAgo } from "@/lib/dates";
import { inPeriod, recurrence, monthly, pareto } from "@/lib/trends";
import { csvFilename, downloadCsv } from "@/lib/csv";
export default function TrendsView() {
  const { data, now } = useStore();
  const today = now.slice(0, 10);
  const [period, setPeriod] = useState("直近6か月");
  const [start, setStart] = useState(monthsAgo(today, 6));
  const [end, setEnd] = useState(today);
  const valid = !!start && !!end && start <= end;
  const claims = valid ? inPeriod(data.claims, start, end) : [];
  const rates = recurrence(claims, data.claims, today);
  const categories = data.settings.categories.map((c) => c.name);
  function exportData() {
    const rows: (string | number)[][] = [
      ["集計期間", start, end],
      ["月", ...categories],
    ];
    monthly(claims, start, end, categories).forEach((r) => rows.push([r.month, ...r.counts]));
    for (const field of ["ms", "tags"] as const) {
      rows.push([field === "ms" ? "4M" : "原因タグ", "件数", "累積%"]);
      pareto(claims, field).forEach((r) => rows.push([r.name, r.count, r.cumulative.toFixed(2)]));
    }
    rows.push(["商品", ...categories]);
    data.settings.products.forEach((p) =>
      rows.push([
        p,
        ...categories.map((c) => claims.filter((v) => v.product === p && v.category === c).length),
      ]),
    );
    rows.push(
      ["効果なし率", rates.failureRate, "分子", rates.failed, "分母", rates.judged],
      ["90日以内再発率", rates.recurrenceRate, "分子", rates.repeated, "分母", rates.observed],
    );
    downloadCsv(csvFilename("クレーム傾向", start, end), rows);
  }
  return (
    <>
      <Heading
        eyebrow="TRENDS & INSIGHTS"
        title="クレームの傾向"
        text="繰り返す原因を見つけて、改善の優先順位を考える。"
      >
        <button disabled={!valid} onClick={exportData}>
          ↓ CSVダウンロード
        </button>
      </Heading>
      <section className="panel filters">
        <Select
          label="集計期間"
          value={period}
          options={["直近3か月", "直近6か月", "直近12か月", "任意"]}
          onChange={(v) => {
            setPeriod(v);
            if (v !== "任意") {
              setStart(monthsAgo(today, parseInt(v.replace("直近", ""))));
              setEnd(today);
            }
          }}
        />
        <label className="field">
          開始日
          <input
            type="date"
            value={start}
            onChange={(e) => {
              setPeriod("任意");
              setStart(e.target.value);
            }}
          />
        </label>
        <label className="field">
          終了日
          <input
            type="date"
            value={end}
            onChange={(e) => {
              setPeriod("任意");
              setEnd(e.target.value);
            }}
          />
        </label>
        <span className="filter-count">
          対象 <strong>{claims.length}</strong> 件
        </span>
      </section>
      {!valid && <p className="error">開始日・終了日を正しく指定してください。</p>}
      <div className="two-columns">
        <div className="stat-card">
          <div>効果なしと判定された割合</div>
          <strong>
            {rates.failureRate.toFixed(1)}
            <small>%</small>
          </strong>
          <p>
            {rates.failed}件 / 判定 {rates.judged}件（延長を除く）
          </p>
        </div>
        <div className="stat-card">
          <div>完了後90日以内の類似クレーム再発率</div>
          <strong>
            {rates.recurrenceRate.toFixed(1)}
            <small>%</small>
          </strong>
          <p>
            {rates.repeated}件 / 90日の観察が済んだ完了 {rates.observed}件
          </p>
        </div>
      </div>
      <p className="muted">
        対象は期間内に受付したクレーム。90日未経過の完了は再発率の分母から除外します。母数0件は0%と表示します。
      </p>
      {valid && <MonthlyChart claims={claims} start={start} end={end} categories={categories} />}
      <div className="two-columns">
        <ParetoChart claims={claims} field="ms" />
        <ParetoChart claims={claims} field="tags" />
      </div>
      <section className="panel form-panel">
        <h2>商品 × 分類</h2>
        <p className="muted">色が濃いほど件数が多い項目です。表は横にスクロールできます。</p>
        <div className="table-scroll">
          <table className="heatmap">
            <thead>
              <tr>
                <th>商品</th>
                {categories.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.settings.products.map((p) => (
                <tr key={p}>
                  <th>{p}</th>
                  {categories.map((c) => {
                    const count = claims.filter((v) => v.product === p && v.category === c).length;
                    return (
                      <td
                        key={c}
                        style={{
                          background: count
                            ? `rgba(70, 119, 95, ${Math.min(0.8, 0.12 + count * 0.12)})`
                            : "#f8f9f6",
                          color: count >= 4 ? "white" : "inherit",
                        }}
                      >
                        {count}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
