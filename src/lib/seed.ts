import type { Data, Claim } from "./types.ts";
import { emptyClaim, nextNumber } from "./claims.ts";
import { addDays, japanNow } from "./dates.ts";
import { stories, settings } from "./seed-stories.ts";

// 本文は個別に手書き。ここでは相対日付と保存形式だけを組み立てる。
// 最も新しい受付も前日以前なので、JSTの0時・月初でも未来の記録を作らない。
export function createSeed(now: Date): Data {
  const today = japanNow(now).slice(0, 10);
  const date = (offset: number) => addDays(today, offset);
  const claims: Claim[] = [];
  for (const story of stories) {
    const received = date(-story.age) + "T" + story.time;
    const claim: Claim = {
      ...emptyClaim(received),
      id: nextNumber(claims, received),
      product: settings.products[story.product],
      category: story.category,
      channel: story.channel,
      severity: story.category === "異物混入" ? "重大" : "中",
      content: story.content,
      lot: story.lot,
      status: story.status,
      analysis: {
        whys: [...story.whys],
        ms: [...story.ms],
        occurrence: story.occurrence,
        escape: story.escape,
        tags: [...story.tags],
        author: settings.members[0],
        date: date(-story.age + 1),
      },
      timeline: [{ at: received, who: settings.members[0], text: "一次対応済み・受付記録" }],
    };
    claim.timeline.push({
      at: claim.analysis.date + "T10:15",
      who: settings.members[0],
      text: story.status === "分析待ち" ? "現物確認前の仮説をメモ" : "原因調査・分析を記録",
    });
    claim.actions = story.actions.map((a, index) => ({
      id: `${claim.id}-action-${index + 1}`,
      kind: a.kind,
      target: a.target,
      content: a.content,
      owner: settings.members[a.owner],
      due: date(a.due),
      status: a.done === undefined ? "実施中" : "完了",
      completed: a.done === undefined ? "" : date(a.done),
      memo: a.memo ?? "",
    }));
    for (const a of claim.actions) {
      if (a.completed) {
        claim.timeline.push({ at: a.completed + "T16:10", who: a.owner, text: a.memo });
      }
    }
    if (story.baseline !== undefined) {
      claim.baseline = date(story.baseline);
      claim.effectDue = date(story.baseline + 30);
      claim.timeline.push({
        at: claim.baseline + "T17:00",
        who: settings.members[0],
        text: "恒久対策の実施を確認・30日間の効果確認を開始",
      });
      if (story.verdict) {
        const at = claim.effectDue + "T17:20";
        claim.verdicts.push({
          result: story.verdict,
          reviewer: settings.members[0],
          comment: story.comment!,
          at,
          due: claim.effectDue,
          baseline: claim.baseline,
          days: 30,
        });
        claim.timeline.push({ at, who: settings.members[0], text: story.comment! });
        if (story.verdict === "効果なし") {
          claim.returns = 1;
          claim.analysis.date = date(-29);
          claim.timeline.push({
            at: date(-29) + "T11:25",
            who: settings.members[0],
            text: "再分析：包装台以外の予備棚に旧版が残存。全棚回収と版照合を開始",
          });
        }
      }
    }
    claims.push(claim);
  }
  return { version: 1, settings: structuredClone(settings), claims };
}
