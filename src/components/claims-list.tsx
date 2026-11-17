"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "./store";
import { Heading, ClaimList, Select } from "./ui";
import { statuses, severities } from "@/lib/types";
import { monthsAgo } from "@/lib/dates";
import { csvFilename, downloadCsv } from "@/lib/csv";
export default function ClaimsList() {
  const { data, now } = useStore();
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [product, setProduct] = useState("");
  const [severity, setSeverity] = useState("");
  const [query, setQuery] = useState("");
  const [start, setStart] = useState(monthsAgo(now, 6));
  const [end, setEnd] = useState(now.slice(0, 10));
  const claims = data.claims
    .filter(
      (c) =>
        (!status || c.status === status) &&
        (!category || c.category === category) &&
        (!product || c.product === product) &&
        (!severity || c.severity === severity) &&
        c.received.slice(0, 10) >= start &&
        c.received.slice(0, 10) <= end &&
        `${c.id} ${c.content} ${c.lot} ${c.analysis.tags.join(" ")}`.includes(query),
    )
    .sort((a, b) => b.received.localeCompare(a.received));
  return (
    <>
      <Heading
        eyebrow="CLAIMS"
        title="クレーム一覧"
        text="お客様の声と、再発防止の進み具合を確認します。"
      >
        <Link className="button primary" href="/claims/new">
          ＋ クレームを登録
        </Link>
      </Heading>
      <section className="panel filters">
        <label className="field search">
          キーワード
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="受付番号・内容・ロット・原因タグ"
          />
        </label>
        <Select label="状態" value={status} onChange={setStatus} options={statuses} all />
        <Select
          label="分類"
          value={category}
          onChange={setCategory}
          options={data.settings.categories.map((c) => c.name)}
          all
        />
        <Select
          label="商品"
          value={product}
          onChange={setProduct}
          options={data.settings.products}
          all
        />
        <Select label="重大度" value={severity} onChange={setSeverity} options={severities} all />
        <label className="field">
          開始日
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="field">
          終了日
          <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </section>
      {start > end && (
        <p role="alert" className="error">
          開始日は終了日以前にしてください。
        </p>
      )}
      <section className="panel">
        <div className="panel-heading">
          <h2>
            検索結果 <span className="muted">{claims.length}件</span>
          </h2>
          <button
            disabled={!start || !end || start > end}
            onClick={() =>
              downloadCsv(csvFilename("クレーム一覧", start, end), [
                [
                  "受付番号",
                  "受付日時",
                  "経路",
                  "商品",
                  "分類",
                  "重大度",
                  "内容",
                  "ロット・店舗",
                  "状態",
                  "発生原因",
                  "流出原因",
                  "原因タグ",
                ],
                ...claims.map((c) => [
                  c.id,
                  c.received,
                  c.channel,
                  c.product,
                  c.category,
                  c.severity,
                  c.content,
                  c.lot,
                  c.status,
                  c.analysis.occurrence,
                  c.analysis.escape,
                  c.analysis.tags.join("・"),
                ]),
              ])
            }
          >
            ↓ CSVダウンロード
          </button>
        </div>
        <ClaimList claims={claims} />
      </section>
    </>
  );
}
