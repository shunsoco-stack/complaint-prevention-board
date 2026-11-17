"use client";
import Link from "next/link";
import { useStore } from "./store";
import { Heading, StatusBadge, Badge } from "./ui";
import { AnalysisForm } from "./analysis-form";
import { ActionEditor } from "./action-editor";
import { EffectPanel } from "./effect-panel";
import { Photos } from "./photos";
import { similarClaims } from "@/lib/similar";
import { SimilarList } from "./similar-list";
export default function ClaimDetail({ id }: { id: string }) {
  const { data, now } = useStore();
  const claim = data.claims.find((c) => c.id === id);
  if (!claim)
    return (
      <>
        <h1>見つかりません</h1>
        <p>指定されたクレームは存在しません。</p>
        <Link className="button" href="/claims">
          一覧に戻る
        </Link>
      </>
    );
  const similar = similarClaims(claim, data.claims, now.slice(0, 10));
  return (
    <>
      <Link className="back-link" href="/claims">
        ← クレーム一覧
      </Link>
      <Heading
        eyebrow={claim.id}
        title={claim.product}
        text={`${claim.received.replace("T", " ")} 受付 · ${claim.channel} · お客様`}
      >
        <StatusBadge status={claim.status} />
        <Badge
          tone={
            claim.severity === "重大" ? "danger" : claim.severity === "中" ? "warning" : "neutral"
          }
        >
          重大度：{claim.severity}
        </Badge>
      </Heading>
      <div className="workflow">
        {["分析待ち", "原因分析中", "対策実施中", "効果確認中", "完了（再発なし）"].map((s, i) => (
          <span className={s === claim.status ? "current" : ""} key={s}>
            {i + 1}. {s}
          </span>
        ))}
      </div>
      <section className="panel form-panel">
        <h2>クレームの概要</h2>
        <div className="button-row">
          <Badge>{claim.category}</Badge>
          <span className="muted">{claim.lot || "ロット・店舗の記録なし"}</span>
        </div>
        <p className="claim-description">{claim.content}</p>
        <Photos ids={claim.photos} sample={claim.sample} />
      </section>
      <AnalysisForm key={claim.id + claim.status} claim={claim} />
      <ActionEditor claim={claim} />
      <EffectPanel claim={claim} />
      <SimilarList key={claim.id} claim={claim} claims={similar} />
      <section className="panel form-panel">
        <h2>タイムライン</h2>
        <ol className="timeline">
          {[...claim.timeline]
            .sort((a, b) => b.at.localeCompare(a.at))
            .map((t, i) => (
              <li key={i}>
                <small>
                  {t.at.replace("T", " ")} · {t.who}
                </small>
                <p>{t.text}</p>
              </li>
            ))}
        </ol>
      </section>
    </>
  );
}
