"use client";
import { useState } from "react";
import type { Claim, Verdict } from "@/lib/types";
import { compareEffect, judgeEffect } from "@/lib/effect";
import { daysBetween, japanNow } from "@/lib/dates";
import { useStore } from "./store";
import { Select, Badge } from "./ui";
export function EffectPanel({ claim }: { claim: Claim }) {
  const { data, now, saveClaim, notice } = useStore();
  const [reviewer, setReviewer] = useState(data.settings.members[0]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const comparison = compareEffect(claim, data.claims);
  const remaining = claim.effectDue ? daysBetween(now, claim.effectDue) : 0;
  function judge(result: Verdict["result"]) {
    try {
      saveClaim(judgeEffect(claim, result, reviewer, comment, japanNow(new Date())));
      setComment("");
      setError("");
      notice("効果判定を記録しました。");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section id="effect" className="panel form-panel">
      <div className="section-title">
        <span className="step">03</span>
        <h2>効果確認</h2>
      </div>
      {claim.baseline ? (
        <>
          <p>
            恒久対策完了日 <strong>{claim.baseline}</strong> ／ 確認予定日{" "}
            <strong>{claim.effectDue}</strong>
          </p>
          <div className="comparison">
            <div>
              <small>対策前 {comparison.days}日</small>
              <strong>
                {comparison.before}
                <small>件</small>
              </strong>
            </div>
            <span>→</span>
            <div>
              <small>
                対策後 {comparison.days}日{remaining > 0 ? "（途中）" : ""}
              </small>
              <strong>
                {comparison.after}
                <small>件</small>
              </strong>
            </div>
          </div>
          <p className="muted">
            同じ商品・分類、または原因タグが共通するクレームを比較。対象自身と対策完了日は除外します。前期間：
            {comparison.start}〜完了日前日、後期間：完了日翌日〜{claim.effectDue}。
          </p>
          {claim.status === "効果確認中" &&
            (remaining > 0 ? (
              <p className="info-banner">確認予定日まであと{remaining}日（判定は予定日以降）</p>
            ) : (
              <div className="inset-form">
                <Badge tone={remaining < 0 ? "danger" : "teal"}>
                  {remaining < 0 ? "確認予定日を過ぎています" : "本日から判定できます"}
                </Badge>
                <Select
                  label="確認者"
                  value={reviewer}
                  onChange={setReviewer}
                  options={data.settings.members}
                />
                <label className="field">
                  確認コメント *
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="件数だけでなく、作業状況や判断の根拠を記録してください。"
                  />
                </label>
                <div className="button-row">
                  <button className="primary" onClick={() => judge("効果あり")}>
                    効果あり（完了）
                  </button>
                  <button className="danger-button" onClick={() => judge("効果なし")}>
                    効果なし（再分析へ）
                  </button>
                  <button onClick={() => judge("延長")}>延長して様子を見る（＋30日）</button>
                </div>
              </div>
            ))}
        </>
      ) : (
        <p className="empty">恒久対策がすべて完了すると、確認予定日を自動で設定します。</p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {claim.verdicts.length > 0 && (
        <div className="verdict-history">
          <h3>判定履歴 · 再分析 {claim.returns}回</h3>
          {claim.verdicts.map((v, i) => (
            <div className="history-item" key={i}>
              <Badge tone={v.result === "効果なし" ? "danger" : "success"}>{v.result}</Badge>
              <span>
                {v.at.replace("T", " ")} · {v.reviewer}
              </span>
              <p>{v.comment}</p>
              <small>
                完了日 {v.baseline} / 予定日 {v.due} / {v.days}日間
              </small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
