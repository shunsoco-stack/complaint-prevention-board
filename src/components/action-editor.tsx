"use client";
import { useState } from "react";
import type { Action, Claim } from "@/lib/types";
import { saveAction, deadline } from "@/lib/actions";
import { transition } from "@/lib/claims";
import { japanNow } from "@/lib/dates";
import { useStore } from "./store";
import { Select, Badge } from "./ui";
export function ActionEditor({ claim }: { claim: Claim }) {
  const { data, now, saveClaim, notice } = useStore();
  const [draft, setDraft] = useState<Action | null>(null);
  const [who, setWho] = useState(data.settings.members[0]);
  const [error, setError] = useState("");
  const locked = claim.status !== "対策実施中";
  function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      saveClaim(saveAction(claim, draft!, japanNow(new Date()), who));
      setDraft(null);
      setError("");
      notice("対策を保存しました。");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function advance() {
    try {
      saveClaim(transition(claim, "効果確認中", japanNow(new Date()), who));
      setError("");
      notice("効果確認を開始しました。");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="panel form-panel">
      <div className="section-title">
        <span className="step">02</span>
        <h2>再発防止策</h2>
      </div>
      <p className="muted">恒久対策を1件以上登録し、すべて完了すると効果確認に進めます。</p>
      {!claim.actions.length && <p className="empty">対策はまだ登録されていません。</p>}
      {claim.actions.map((a) => (
        <article className="action-summary" key={a.id}>
          <div className="button-row">
            <Badge tone={a.kind === "恒久対策" ? "teal" : "neutral"}>{a.kind}</Badge>
            <Badge>{a.target}</Badge>
            <Badge tone={deadline(a.due, now, a.status === "完了").tone}>
              {deadline(a.due, now, a.status === "完了").label}
            </Badge>
          </div>
          <h3>{a.content}</h3>
          <p>
            {a.owner} · 期限 {a.due} · {a.status}
          </p>
          {a.completed && (
            <p>
              完了日 {a.completed} / {a.memo}
            </p>
          )}
          {!locked && <button onClick={() => setDraft(a)}>編集・進捗を更新</button>}
        </article>
      ))}
      {!locked && !draft && (
        <button
          onClick={() =>
            setDraft({
              id: crypto.randomUUID(),
              kind: "恒久対策",
              target: "発生対策",
              content: "",
              owner: data.settings.members[0],
              due: "",
              status: "未着手",
              completed: "",
              memo: "",
            })
          }
        >
          ＋ 対策を追加
        </button>
      )}
      {draft && (
        <form onSubmit={save} className="inset-form">
          <div className="form-grid">
            <Select
              label="種別"
              value={draft.kind}
              onChange={(v) => setDraft({ ...draft, kind: v as Action["kind"] })}
              options={["暫定対策", "恒久対策"]}
            />
            <Select
              label="対象"
              value={draft.target}
              onChange={(v) => setDraft({ ...draft, target: v as Action["target"] })}
              options={["発生対策", "流出対策"]}
            />
          </div>
          <label className="field">
            対策内容 *
            <textarea
              required
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            />
          </label>
          <div className="form-grid">
            <Select
              label="担当者"
              value={draft.owner}
              onChange={(v) => setDraft({ ...draft, owner: v })}
              options={data.settings.members}
            />
            <label className="field">
              期限 *
              <input
                required
                type="date"
                value={draft.due}
                onChange={(e) => setDraft({ ...draft, due: e.target.value })}
              />
            </label>
            <Select
              label="状態"
              value={draft.status}
              onChange={(v) =>
                setDraft({
                  ...draft,
                  status: v as Action["status"],
                  completed: v === "完了" ? now.slice(0, 10) : "",
                  memo: v === "完了" ? draft.memo : "",
                })
              }
              options={["未着手", "実施中", "完了"]}
            />
            {draft.status === "完了" && (
              <label className="field">
                完了日 *
                <input
                  required
                  type="date"
                  min={claim.received.slice(0, 10)}
                  max={now.slice(0, 10)}
                  value={draft.completed}
                  onChange={(e) => setDraft({ ...draft, completed: e.target.value })}
                />
              </label>
            )}
          </div>
          {draft.status === "完了" && (
            <label className="field">
              完了メモ *
              <textarea
                required
                value={draft.memo}
                onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
              />
            </label>
          )}
          <Select label="記録者" value={who} onChange={setWho} options={data.settings.members} />
          <div className="button-row">
            <button className="primary">対策を保存</button>
            <button type="button" onClick={() => setDraft(null)}>
              キャンセル
            </button>
          </div>
        </form>
      )}
      {!locked && !draft && (
        <div className="form-footer">
          <Select
            label="状態変更の記録者"
            value={who}
            onChange={setWho}
            options={data.settings.members}
          />
          <button className="primary" onClick={advance}>
            効果確認中へ →
          </button>
        </div>
      )}
      {claim.effectDue && (
        <p className="muted">
          効果確認予定日：{claim.effectDue}（確認期間 {claim.effectDays}日）
        </p>
      )}
      {locked && !claim.actions.length && (
        <p className="muted">原因分析を保存し、対策実施中に進むと対策を追加できます。</p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
