import { validateAnalysis } from "./analysis.ts";
import { effectSchedule } from "./actions.ts";
import { validStamp } from "./dates.ts";
import type { Claim, Status } from "./types.ts";
export function nextNumber(claims: Claim[], date: string): string {
  const prefix = `C-${date.slice(2, 4)}${date.slice(5, 7)}-`;
  const max = Math.max(
    0,
    ...claims.filter((c) => c.id.startsWith(prefix)).map((c) => Number(c.id.slice(prefix.length))),
  );
  return prefix + String(max + 1).padStart(3, "0");
}
export function emptyClaim(date: string): Claim {
  return {
    id: "",
    received: date,
    channel: "店頭",
    product: "",
    category: "",
    severity: "中",
    content: "",
    lot: "",
    photos: [],
    sample: false,
    status: "分析待ち",
    analysis: { whys: [""], ms: [], occurrence: "", escape: "", tags: [], author: "", date: "" },
    actions: [],
    effectDue: "",
    effectDays: 30,
    baseline: "",
    verdicts: [],
    returns: 0,
    timeline: [],
  };
}
export function registerClaim(claim: Claim, claims: Claim[], now: string, who: string): Claim {
  if (
    !claim.product ||
    !claim.category ||
    !claim.content.trim() ||
    !validStamp(claim.received) ||
    claim.received > now
  ) {
    throw new Error("商品・分類・内容と、現在以前の受付日時を入力してください。");
  }
  return {
    ...claim,
    id: nextNumber(claims, claim.received),
    timeline: [{ at: now, who, text: "一次対応済みのクレームを登録" }],
  };
}
export function transition(claim: Claim, target: Status, now: string, who: string): Claim {
  const allowed: Partial<Record<Status, Status>> = {
    分析待ち: "原因分析中",
    原因分析中: "対策実施中",
    対策実施中: "効果確認中",
  };
  if (allowed[claim.status] !== target) throw new Error("この状態変更はできません。");
  if (target === "対策実施中") validateAnalysis(claim.analysis);
  const schedule = effectSchedule(claim.actions, claim.effectDays);
  if (target === "効果確認中" && !schedule)
    throw new Error("恒久対策を1件以上登録し、すべて完了してください。");
  return {
    ...claim,
    status: target,
    ...(target === "効果確認中" ? { baseline: schedule!.baseline, effectDue: schedule!.due } : {}),
    timeline: [...claim.timeline, { at: now, who, text: `${claim.status} → ${target}` }],
  };
}
