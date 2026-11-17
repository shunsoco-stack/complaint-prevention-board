import test from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/lib/seed.ts";
import { japanNow, monthsAgo, addDays } from "../src/lib/dates.ts";
import { compareEffect } from "../src/lib/effect.ts";
import { recurrence, monthly, inPeriod } from "../src/lib/trends.ts";
import { groupSimilarClaims, similarClaims } from "../src/lib/similar.ts";
import { registerClaim, emptyClaim } from "../src/lib/claims.ts";
import { validateData } from "../src/lib/storage.ts";

const stamps = [
  "2026-11-18T00:00",
  "2026-11-18T04:15",
  "2026-11-18T09:05",
  "2026-11-18T12:30",
  "2026-11-18T23:59",
  "2026-12-01T00:00",
  "2026-11-30T23:59",
  "2026-12-31T23:59",
  "2027-01-01T00:00",
  "2027-07-01T00:00",
  "2028-02-29T00:00",
  "2028-03-01T00:00",
];
for (const stamp of stamps) {
  const now = new Date(stamp + "+09:00");
  const data = createSeed(now);
  const today = japanNow(now).slice(0, 10);
  test(`記録順序・受付時刻を全件検証：${stamp}`, () => {
    assert.equal(validateData(data), true);
    for (const c of data.claims) {
      assert.ok(c.received < stamp, c.id);
      const clock = c.received.slice(11);
      const daytime = ["電話", "店頭"].includes(c.channel);
      assert.ok(clock >= (daytime ? "09:00" : "07:00"), c.id);
      assert.ok(clock <= (daytime ? "19:00" : "23:30"), c.id);
      assert.ok(c.analysis.date < today);
      assert.ok(c.analysis.date >= c.received.slice(0, 10));
      if (c.baseline) assert.ok(c.baseline < today);
      c.actions.forEach((a) => {
        if (a.completed) {
          assert.ok(a.completed < today);
          assert.ok(a.completed >= c.received.slice(0, 10));
        }
      });
      c.timeline.forEach((t) => assert.ok(t.at >= c.received && t.at < stamp));
      c.verdicts.forEach((v) => {
        assert.ok(v.at < stamp);
        assert.ok(v.baseline < v.due && v.due <= v.at.slice(0, 10));
      });
    }
  });
  test(`判定と実計算の一致：${stamp}`, () => {
    const judged = data.claims.filter((c) => c.verdicts.length);
    assert.ok(judged.some((c) => c.verdicts.some((v) => v.result === "効果なし")));
    for (const c of judged) {
      for (const v of c.verdicts) {
        const after = compareEffect(
          { ...c, baseline: v.baseline, effectDue: v.due },
          data.claims,
        ).after;
        if (v.result === "効果あり") assert.equal(after, 0, c.lot);
        if (v.result === "効果なし") assert.ok(after >= 1, c.lot);
      }
    }
  });
  test(`全期間と画面初期6か月の再発率：${stamp}`, () => {
    const subset = inPeriod(data.claims, monthsAgo(today, 6), today);
    for (const claims of [data.claims, subset]) {
      const rate = recurrence(claims, data.claims, today);
      assert.equal(rate.repeated, 1);
      assert.equal(rate.observed, 7);
      assert.ok(rate.recurrenceRate > 0 && rate.recurrenceRate < 50);
    }
  });
  test(`月別件数には増減がある：${stamp}`, () => {
    const rows = monthly(
      data.claims,
      monthsAgo(today, 6),
      today,
      data.settings.categories.map((c) => c.name),
    );
    assert.ok(new Set(rows.map((r) => r.total)).size >= 3);
    const intervals = data.claims.map((c) => c.received.slice(0, 10)).sort();
    assert.ok(
      new Set(intervals.slice(1).map((d, i) => Date.parse(d) - Date.parse(intervals[i]))).size > 3,
    );
  });
}
const data = createSeed(new Date("2026-11-18T00:00+09:00"));
test("原因タグは10種類・各案件1〜2個・最多30%以下", () => {
  assert.equal(data.settings.tags.length, 10);
  const counts = new Map();
  for (const c of data.claims) {
    assert.ok(c.analysis.tags.length >= 1 && c.analysis.tags.length <= 2);
    c.analysis.tags.forEach((tag) => {
      assert.ok(data.settings.tags.includes(tag));
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  }
  assert.equal(counts.size, 10);
  assert.ok(Math.max(...counts.values()) <= data.claims.length * 0.3);
});
for (const field of ["whys", "occurrence", "escape", "actions"]) {
  test(`3案件以上で同一文を使い回さない：${field}`, () => {
    const counts = new Map();
    for (const c of data.claims) {
      const sentences =
        field === "actions"
          ? c.actions.map((a) => a.content)
          : field === "whys"
            ? c.analysis.whys
            : [c.analysis[field]];
      for (const sentence of new Set(sentences.flatMap((s) => s.split(/。|\n/)).filter(Boolean))) {
        counts.set(sentence, (counts.get(sentence) ?? 0) + 1);
      }
    }
    for (const [sentence, count] of counts) assert.ok(count < 3, sentence);
  });
}
test("全30件に具体的な仮説または分析と1〜3対策を持つ", () => {
  assert.equal(data.claims.length, 30);
  for (const c of data.claims) {
    assert.ok(c.analysis.whys.length >= 2 && c.analysis.whys.length <= 5);
    assert.ok(c.analysis.ms.length >= 1);
    assert.ok(c.actions.length >= 1 && c.actions.length <= 3);
    assert.ok(c.analysis.occurrence && c.analysis.escape);
  }
});
test("ギフト缶は4件・先行3件は暫定のみ・最後の恒久対策後は類似0件", () => {
  const gifts = data.claims
    .filter((c) => c.product === "こもれびギフト缶")
    .sort((a, b) => a.received.localeCompare(b.received));
  assert.equal(gifts.length, 4);
  gifts.slice(0, 3).forEach((c) => {
    assert.equal(c.verdicts.length, 0);
    assert.ok(c.actions.every((a) => a.kind === "暫定対策"));
  });
  assert.equal(gifts[3].verdicts[0].result, "効果あり");
  assert.equal(compareEffect(gifts[3], data.claims).after, 0);
  assert.ok(gifts[3].actions.some((a) => a.content.includes("成形パルプ")));
});
test("旧版ラベルは初回完了・再発1件・再分析・2回目実施中", () => {
  const c = data.claims.find((c) => c.returns === 1);
  assert.equal(c.verdicts[0].result, "効果なし");
  assert.equal(compareEffect(c, data.claims).after, 1);
  assert.equal(c.status, "対策実施中");
  assert.ok(c.actions.some((a) => a.status === "完了" && a.content.startsWith("初回")));
  assert.ok(c.actions.some((a) => a.status === "実施中" && a.content.startsWith("2回目")));
  assert.ok(c.analysis.date > c.verdicts[0].at.slice(0, 10));
});
test("期限超過2件・今週1件・確認待ち1件・確認期間中1件・分析待ちと分析中各2件", () => {
  const today = "2026-11-18";
  const open = data.claims.flatMap((c) => c.actions).filter((a) => a.status !== "完了");
  assert.equal(open.filter((a) => a.due < today).length, 2);
  assert.equal(open.filter((a) => a.due >= today && a.due <= addDays(today, 7)).length, 1);
  const effects = data.claims.filter((c) => c.status === "効果確認中");
  assert.equal(effects.filter((c) => c.effectDue < today).length, 1);
  assert.equal(effects.filter((c) => c.effectDue > today).length, 1);
  for (const status of ["分析待ち", "原因分析中"]) {
    assert.equal(data.claims.filter((c) => c.status === status).length, 2);
  }
});
test("類似理由グループ間で案件は重複しない", () => {
  for (const c of data.claims) {
    const matching = similarClaims(c, data.claims, "2026-11-18");
    for (const visible of [matching.slice(0, 5), matching]) {
      const groups = groupSimilarClaims(c, visible);
      const ids = groups.flatMap((g) => g.items.map((item) => item.id));
      assert.equal(ids.length, new Set(ids).size);
      assert.equal(ids.length, visible.length);
      assert.ok(groups.every((g) => g.reason.length > 0));
    }
  }
});
for (const field of ["product", "category"]) {
  test(`未選択では登録できない：${field}`, () => {
    const claim = {
      ...emptyClaim("2026-11-17T12:00"),
      product: "商品",
      category: "分類",
      content: "内容",
      [field]: "",
    };
    assert.throws(() => registerClaim(claim, [], "2026-11-18T12:00", "担当"));
  });
}
