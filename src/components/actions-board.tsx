"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "./store";
import { Heading, Select, Badge } from "./ui";
import { deadline } from "@/lib/actions";
import { csvFilename, downloadCsv } from "@/lib/csv";
const states = ["未着手", "実施中", "完了"];
export default function ActionsBoard() {
  const { data, now } = useStore();
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [sort, setSort] = useState("期限が近い順");
  const [tab, setTab] = useState("未着手");
  const actions = data.claims
    .flatMap((c) => c.actions.map((a) => ({ ...a, claim: c })))
    .filter(
      (a) =>
        (!owner || a.owner === owner) &&
        (!due ||
          (due === "期限超過"
            ? a.status !== "完了" && a.due < now.slice(0, 10)
            : a.status !== "完了" &&
              deadline(a.due, now).days >= 0 &&
              deadline(a.due, now).days <= 7)),
    )
    .sort((a, b) =>
      sort === "担当者順"
        ? a.owner.localeCompare(b.owner, "ja")
        : sort === "期限が遠い順"
          ? b.due.localeCompare(a.due)
          : a.due.localeCompare(b.due),
    );
  return (
    <>
      <Heading
        eyebrow="ACTION BOARD"
        title="再発防止策ボード"
        text="担当と期限を明確に。改善を一つずつ、確実に。"
      >
        <button
          onClick={() =>
            downloadCsv(csvFilename("再発防止策", now.slice(0, 10)), [
              ["受付番号", "種別", "対象", "内容", "担当者", "期限", "状態", "完了日", "完了メモ"],
              ...actions.map((a) => [
                a.claim.id,
                a.kind,
                a.target,
                a.content,
                a.owner,
                a.due,
                a.status,
                a.completed,
                a.memo,
              ]),
            ])
          }
        >
          ↓ CSVダウンロード
        </button>
      </Heading>
      <section className="panel filters">
        <Select
          label="担当者"
          value={owner}
          onChange={setOwner}
          options={data.settings.members}
          all
        />
        <Select label="期限" value={due} onChange={setDue} options={["期限超過", "7日以内"]} all />
        <Select
          label="並べ替え"
          value={sort}
          onChange={setSort}
          options={["期限が近い順", "期限が遠い順", "担当者順"]}
        />
      </section>
      <div className="board-tabs" role="tablist" aria-label="対策の状態">
        {states.map((s) => (
          <button
            role="tab"
            aria-selected={tab === s}
            key={s}
            className={tab === s ? "selected" : ""}
            onClick={() => setTab(s)}
          >
            {s} {actions.filter((a) => a.status === s).length}
          </button>
        ))}
      </div>
      <div className="kanban">
        {states.map((state) => (
          <section className={`kanban-column ${tab === state ? "shown" : ""}`} key={state}>
            <h2>
              <span
                className={`dot ${state === "完了" ? "teal" : state === "実施中" ? "blue" : "warning"}`}
              />
              {state}
              <span>{actions.filter((a) => a.status === state).length}</span>
            </h2>
            {actions
              .filter((a) => a.status === state)
              .map((a) => (
                <Link className="kanban-card" key={a.id} href={`/claims/${a.claim.id}`}>
                  <div className="button-row">
                    <Badge tone={a.kind === "恒久対策" ? "teal" : "neutral"}>{a.kind}</Badge>
                    <small>{a.target}</small>
                  </div>
                  <h3>{a.content}</h3>
                  <p className="mono">{a.claim.id}</p>
                  <small>{a.claim.product}</small>
                  <div className="card-footer">
                    <span>{a.owner}</span>
                    <Badge tone={deadline(a.due, now, state === "完了").tone}>
                      {deadline(a.due, now, state === "完了").label}
                    </Badge>
                  </div>
                  <small>期限 {a.due}</small>
                </Link>
              ))}
            {!actions.some((a) => a.status === state) && (
              <p className="empty">対策はありません。</p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
