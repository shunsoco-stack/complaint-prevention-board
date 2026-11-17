import type { Claim, Verdict } from "./types.ts";
import { addDays, daysBetween } from "./dates.ts";
import { similarReasons } from "./similar.ts";
export function compareEffect(claim: Claim, claims: Claim[]) {
  const days =
    claim.baseline && claim.effectDue
      ? daysBetween(claim.baseline, claim.effectDue)
      : claim.effectDays;
  const start = claim.baseline ? addDays(claim.baseline, -days) : "";
  const matching = claims.filter((c) => c.id !== claim.id && similarReasons(claim, c).length);
  return {
    days,
    start,
    before: matching.filter(
      (c) => c.received.slice(0, 10) >= start && c.received.slice(0, 10) < claim.baseline,
    ).length,
    after: matching.filter(
      (c) => c.received.slice(0, 10) > claim.baseline && c.received.slice(0, 10) <= claim.effectDue,
    ).length,
  };
}
export function judgeEffect(
  claim: Claim,
  result: Verdict["result"],
  reviewer: string,
  comment: string,
  now: string,
): Claim {
  if (claim.status !== "効果確認中" || !claim.effectDue || now.slice(0, 10) < claim.effectDue) {
    throw new Error("判定は効果確認予定日以降に行えます。");
  }
  if (!reviewer || !comment.trim()) throw new Error("確認者とコメントを入力してください。");
  const verdict: Verdict = {
    result,
    reviewer,
    comment,
    at: now,
    due: claim.effectDue,
    baseline: claim.baseline,
    days: daysBetween(claim.baseline, claim.effectDue),
  };
  const status =
    result === "効果あり"
      ? "完了（再発なし）"
      : result === "効果なし"
        ? "原因分析中"
        : "効果確認中";
  return {
    ...claim,
    verdicts: [...claim.verdicts, verdict],
    status,
    effectDue: result === "延長" ? addDays(claim.effectDue, 30) : claim.effectDue,
    returns: claim.returns + (result === "効果なし" ? 1 : 0),
    timeline: [
      ...claim.timeline,
      { at: now, who: reviewer, text: `${claim.status} → ${status}（${result}）：${comment}` },
    ],
  };
}
