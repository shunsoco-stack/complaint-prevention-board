import type { Claim } from "./types.ts";
import { addDays } from "./dates.ts";
type Subject = Pick<Claim, "product" | "category" | "analysis">;
// 理由の組合せで分類し、複数の理由がある案件も重複掲載しない。
export function groupSimilarClaims(claim: Claim, claims: Claim[]) {
  const groups = new Map<string, Claim[]>();
  for (const other of claims) {
    const reason = similarReasons(claim, other).join(" / ");
    if (!reason) continue;
    const items = groups.get(reason) ?? [];
    items.push(other);
    groups.set(reason, items);
  }
  return [...groups].map(([reason, items]) => ({ reason, items }));
}
export function similarReasons(a: Subject, b: Subject): string[] {
  const reasons: string[] = [];
  if (a.product === b.product && a.category === b.category) reasons.push("同じ商品・分類");
  a.analysis.tags
    .filter((tag) => b.analysis.tags.includes(tag))
    .forEach((tag) => reasons.push(`原因タグ：${tag}`));
  return reasons;
}
export function similarClaims(claim: Claim, claims: Claim[], today: string): Claim[] {
  return claims
    .filter(
      (other) =>
        other.id !== claim.id &&
        other.received.slice(0, 10) >= addDays(today, -180) &&
        other.received.slice(0, 10) <= today &&
        similarReasons(claim, other).length > 0,
    )
    .sort((a, b) => b.received.localeCompare(a.received));
}
