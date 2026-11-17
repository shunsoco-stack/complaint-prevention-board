import type { Action, Claim } from "./types.ts";
import { addDays, daysBetween, validDate } from "./dates.ts";
export function deadline(due: string, today: string, completed = false) {
  const days = daysBetween(today, due);
  return {
    days,
    tone: completed ? "neutral" : days < 0 ? "danger" : days <= 7 ? "warning" : "neutral",
    label: completed
      ? "完了"
      : days < 0
        ? `${-days}日超過`
        : days === 0
          ? "本日期限"
          : `あと${days}日`,
  };
}
export function effectSchedule(actions: Action[], days: number) {
  const permanent = actions.filter((a) => a.kind === "恒久対策");
  if (!permanent.length || permanent.some((a) => a.status !== "完了" || !a.completed)) return null;
  const baseline = permanent
    .map((a) => a.completed)
    .sort()
    .at(-1)!;
  return { baseline, due: addDays(baseline, days) };
}
export function saveAction(claim: Claim, action: Action, now: string, who: string): Claim {
  if (!action.content.trim() || !action.owner || !validDate(action.due))
    throw new Error("内容・担当者・期限を入力してください。");
  if (
    action.status === "完了" &&
    (!validDate(action.completed) ||
      action.completed > now.slice(0, 10) ||
      action.completed < claim.received.slice(0, 10) ||
      !action.memo.trim())
  ) {
    throw new Error("完了日（受付日以降・今日以前）と完了メモを入力してください。");
  }
  if (claim.status === "効果確認中" || claim.status === "完了（再発なし）") {
    throw new Error("効果確認開始後の対策は変更できません。");
  }
  const actions = claim.actions.some((a) => a.id === action.id)
    ? claim.actions.map((a) => (a.id === action.id ? action : a))
    : [...claim.actions, action];
  const schedule = effectSchedule(actions, claim.effectDays);
  return {
    ...claim,
    actions,
    baseline: schedule?.baseline ?? "",
    effectDue: schedule?.due ?? "",
    timeline: [
      ...claim.timeline,
      { at: now, who, text: `対策を保存：${action.content}（${action.status}）` },
    ],
  };
}
