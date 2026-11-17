"use client";
import { useState } from "react";
import type { Claim } from "@/lib/types";
import { fourMs } from "@/lib/types";
import { addWhy } from "@/lib/analysis";
import { transition } from "@/lib/claims";
import { japanNow } from "@/lib/dates";
import { useStore } from "./store";
import { Select } from "./ui";
export function AnalysisForm({ claim }: { claim: Claim }) {
  const { data, saveClaim, now, notice } = useStore();
  // 分析日が未入力なら、今日（日本時間）を初期値にする
  const [analysis, setAnalysis] = useState(() =>
    claim.analysis.date
      ? claim.analysis
      : { ...claim.analysis, date: japanNow(new Date()).slice(0, 10) },
  );
  const [tag, setTag] = useState("");
  const [error, setError] = useState("");
  const locked = !["分析待ち", "原因分析中"].includes(claim.status);
  function save(advance = false) {
    try {
      const at = japanNow(new Date());
      if (
        !analysis.author ||
        !analysis.date ||
        analysis.date > at.slice(0, 10) ||
        analysis.date < claim.received.slice(0, 10)
      )
        throw new Error("分析者と分析日（受付日以降・今日以前）を入力してください。");
      let next = {
        ...claim,
        analysis,
        timeline: [...claim.timeline, { at, who: analysis.author, text: "原因分析を保存" }],
      };
      if (next.status === "分析待ち") next = transition(next, "原因分析中", at, analysis.author);
      if (advance) next = transition(next, "対策実施中", at, analysis.author);
      saveClaim(next);
      notice("原因分析を保存しました。");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="panel form-panel">
      <div className="section-title">
        <span className="step">01</span>
        <h2>原因分析</h2>
      </div>
      <fieldset disabled={locked}>
        <h3>
          なぜなぜ分析 <small>1〜5段</small>
        </h3>
        <div className="why-list">
          {analysis.whys.map((why, i) => (
            <label className="why-row" key={i}>
              <span>なぜ {i + 1}</span>
              <input
                aria-label={`なぜ ${i + 1}`}
                value={why}
                onChange={(e) =>
                  setAnalysis({
                    ...analysis,
                    whys: analysis.whys.map((w, n) => (n === i ? e.target.value : w)),
                  })
                }
              />
            </label>
          ))}
        </div>
        <div className="button-row">
          <button
            type="button"
            disabled={analysis.whys.length >= 5 || locked}
            onClick={() => setAnalysis({ ...analysis, whys: addWhy(analysis.whys) })}
          >
            ＋ なぜを追加
          </button>
          {analysis.whys.length > 1 && (
            <button
              type="button"
              onClick={() => setAnalysis({ ...analysis, whys: analysis.whys.slice(0, -1) })}
            >
              最後の段を削除
            </button>
          )}
        </div>
        <h3>4M分類（複数選択可）</h3>
        <div className="checks">
          {fourMs.map((m) => (
            <label key={m}>
              <input
                type="checkbox"
                checked={analysis.ms.includes(m)}
                onChange={(e) =>
                  setAnalysis({
                    ...analysis,
                    ms: e.target.checked ? [...analysis.ms, m] : analysis.ms.filter((v) => v !== m),
                  })
                }
              />
              {m}
            </label>
          ))}
        </div>
        <div className="form-grid">
          <label className="field">
            発生原因 *
            <textarea
              rows={3}
              placeholder="なぜ起きたか"
              value={analysis.occurrence}
              onChange={(e) => setAnalysis({ ...analysis, occurrence: e.target.value })}
            />
          </label>
          <label className="field">
            流出原因 *
            <textarea
              rows={3}
              placeholder="なぜ検査・確認で止められなかったか"
              value={analysis.escape}
              onChange={(e) => setAnalysis({ ...analysis, escape: e.target.value })}
            />
          </label>
        </div>
        <h3>原因タグ</h3>
        <div className="checks">
          {Array.from(new Set([...data.settings.tags, ...analysis.tags])).map((t) => (
            <label key={t}>
              <input
                type="checkbox"
                checked={analysis.tags.includes(t)}
                onChange={(e) =>
                  setAnalysis({
                    ...analysis,
                    tags: e.target.checked
                      ? [...analysis.tags, t]
                      : analysis.tags.filter((v) => v !== t),
                  })
                }
              />
              {t}
            </label>
          ))}
        </div>
        <div className="inline-form">
          <input
            aria-label="新しい原因タグ"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="新しい原因タグ"
          />
          <button
            type="button"
            onClick={() => {
              if (tag.trim())
                setAnalysis({
                  ...analysis,
                  tags: Array.from(new Set([...analysis.tags, tag.trim()])),
                });
              setTag("");
            }}
          >
            追加
          </button>
        </div>
        <div className="form-grid">
          <Select
            label="分析者 *"
            value={analysis.author}
            onChange={(v) => setAnalysis({ ...analysis, author: v })}
            options={["", ...data.settings.members]}
          />
          <label className="field">
            分析日 *
            <input
              type="date"
              min={claim.received.slice(0, 10)}
              max={now.slice(0, 10)}
              value={analysis.date}
              onChange={(e) => setAnalysis({ ...analysis, date: e.target.value })}
            />
          </label>
        </div>
      </fieldset>
      {!locked && (
        <div className="form-footer">
          <button onClick={() => save()}>分析を保存</button>
          <button className="primary" onClick={() => save(true)}>
            保存して対策実施中へ →
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
