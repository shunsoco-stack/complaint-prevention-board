import Link from "next/link";
import type { Claim } from "@/lib/types";
export function Heading({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "分析待ち"
      ? "warning"
      : status === "原因分析中"
        ? "purple"
        : status === "対策実施中"
          ? "blue"
          : status === "効果確認中"
            ? "teal"
            : "success";
  return <Badge tone={tone}>{status}</Badge>;
}
export function ClaimList({ claims }: { claims: Claim[] }) {
  if (!claims.length) return <p className="empty">該当するクレームはありません。</p>;
  return (
    <div className="claim-list">
      {claims.map((c) => (
        <Link href={`/claims/${c.id}`} key={c.id} className="claim-row">
          <div className="claim-main">
            <div className="row-meta">
              <span className="mono">{c.id}</span>
              <span>{c.received.replace("T", " ")}</span>
              <Badge
                tone={
                  c.severity === "重大" ? "danger" : c.severity === "中" ? "warning" : "neutral"
                }
              >
                {c.severity}
              </Badge>
            </div>
            <strong>{c.content}</strong>
            <small>
              {c.product} <span className="separator">/</span> {c.category}
            </small>
          </div>
          <StatusBadge status={c.status} />
          <span className="chevron">›</span>
        </Link>
      ))}
    </div>
  );
}
export function Select({
  label,
  value,
  onChange,
  options,
  all = false,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  all?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      {label}
      <select
        aria-label={label}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      >
        {all && <option value="">すべて</option>}
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
