"use client";
import { useState } from "react";
import Link from "next/link";
import type { Claim } from "@/lib/types";
import { groupSimilarClaims } from "@/lib/similar";

export function SimilarList({ claim, claims }: { claim: Claim; claims: Claim[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? claims : claims.slice(0, 5);
  const groups = groupSimilarClaims(claim, visible);
  return (
    <section className="panel form-panel">
      <h2>
        類似クレーム <small>直近180日 · {claims.length}件</small>
      </h2>
      {claims.length === 0 ? (
        <p className="empty">類似クレームはありません。</p>
      ) : (
        <div id="similar-claims">
          <p className="muted">新しい順に{visible.length}件を表示 · 類似理由ごとに分類</p>
          {groups.map(({ reason, items }) => (
            <section key={reason} aria-label={reason}>
              <h3>{reason}</h3>
              {items.map((c) => (
                <Link href={`/claims/${c.id}`} className="task-row" key={c.id}>
                  <div>
                    <span className="mono">
                      {c.id} · {c.received.slice(0, 10)}
                    </span>
                    <strong>{c.content}</strong>
                  </div>
                  <span aria-hidden="true">›</span>
                </Link>
              ))}
            </section>
          ))}
        </div>
      )}
      {claims.length > 5 && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="similar-claims"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "最初の5件に戻す" : `すべて表示（${claims.length}件）`}
        </button>
      )}
    </section>
  );
}
