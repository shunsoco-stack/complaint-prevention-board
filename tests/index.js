import "./seed.js";
import test from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/lib/seed.ts";
import { nextNumber, emptyClaim, registerClaim, transition } from "../src/lib/claims.ts";
import {
  addDays,
  daysBetween,
  japanNow,
  validDate,
  validStamp,
  monthsAgo,
} from "../src/lib/dates.ts";
import { addWhy, validateAnalysis } from "../src/lib/analysis.ts";
import { deadline, effectSchedule, saveAction } from "../src/lib/actions.ts";
import { compareEffect, judgeEffect } from "../src/lib/effect.ts";
import { similarReasons, similarClaims } from "../src/lib/similar.ts";
import { monthly, pareto, recurrence, inPeriod } from "../src/lib/trends.ts";
import { csv, csvFilename } from "../src/lib/csv.ts";
import { validateData, decodeStorage } from "../src/lib/storage.ts";

const now = "2026-11-18T12:00";
const data = createSeed(new Date(now + "+09:00"));
const fresh = () => ({
  ...emptyClaim("2026-10-01T12:00"),
  id: "C-2610-001",
  product: "商品A",
  category: "包装破損",
  content: "箱が破損",
});
const analysis = {
  whys: ["確認不足"],
  ms: ["方法"],
  occurrence: "梱包強度不足",
  escape: "基準不足",
  tags: ["検品漏れ"],
  author: "品質担当",
  date: "2026-10-02",
};
const action = {
  id: "a1",
  kind: "恒久対策",
  target: "発生対策",
  content: "緩衝材変更",
  owner: "製造担当",
  due: "2026-10-03",
  status: "完了",
  completed: "2026-10-03",
  memo: "導入済み",
};
const ready = () => ({
  ...fresh(),
  status: "効果確認中",
  analysis,
  actions: [action],
  baseline: "2026-10-03",
  effectDue: "2026-11-02",
});

test("JSTはUTCの日付境界を正しく変換", () =>
  assert.equal(japanNow(new Date("2026-11-17T15:30:00Z")), "2026-11-18T00:30"));
test("加算は月末を越える", () => assert.equal(addDays("2026-01-31", 1), "2026-02-01"));
test("加算は年末を越える", () => assert.equal(addDays("2026-12-31", 1), "2027-01-01"));
test("うるう年の日付を検証", () => assert.equal(validDate("2024-02-29"), true));
test("存在しない日付を拒否", () => assert.equal(validDate("2026-02-29"), false));
test("24時を拒否", () => assert.equal(validStamp("2026-11-18T24:00"), false));
test("月初から直近3か月", () => assert.equal(monthsAgo("2026-01-01", 3), "2025-11-01"));
test("日数は日本時間の暦日", () => assert.equal(daysBetween("2026-10-31T23:30", "2026-11-01"), 1));
test("採番の初回", () => assert.equal(nextNumber([], "2026-11-18"), "C-2611-001"));
test("採番は最大番号の次", () =>
  assert.equal(nextNumber([{ id: "C-2611-009" }, { id: "C-2611-002" }], now), "C-2611-010"));
test("採番は月ごとにリセット", () =>
  assert.equal(nextNumber([{ id: "C-2610-009" }], now), "C-2611-001"));
test("登録で記録者を残す", () =>
  assert.equal(registerClaim(fresh(), [], now, "記録者").timeline[0].who, "記録者"));
test("未来の受付を拒否", () =>
  assert.throws(() =>
    registerClaim({ ...fresh(), received: "2027-01-01T12:00" }, [], now, "担当"),
  ));
test("空の内容を拒否", () =>
  assert.throws(() => registerClaim({ ...fresh(), content: " " }, [], now, "担当")));
test("分析開始の履歴", () =>
  assert.equal(transition(fresh(), "原因分析中", now, "担当").timeline.length, 1));
test("状態の飛び越しを拒否", () =>
  assert.throws(() => transition(fresh(), "効果確認中", now, "担当")));
test("発生原因なしでは進めない", () =>
  assert.throws(() =>
    transition(
      { ...fresh(), status: "原因分析中", analysis: { ...analysis, occurrence: "" } },
      "対策実施中",
      now,
      "担当",
    ),
  ));
test("流出原因なしでは進めない", () =>
  assert.throws(() =>
    transition(
      { ...fresh(), status: "原因分析中", analysis: { ...analysis, escape: "" } },
      "対策実施中",
      now,
      "担当",
    ),
  ));
test("両原因があれば対策へ進む", () =>
  assert.equal(
    transition({ ...fresh(), status: "原因分析中", analysis }, "対策実施中", now, "担当").status,
    "対策実施中",
  ));
test("なぜを追加", () => assert.deepEqual(addWhy(["理由"]), ["理由", ""]));
test("なぜの6段目を拒否", () => assert.throws(() => addWhy(["1", "2", "3", "4", "5"])));
test("なぜ0段を拒否", () => assert.throws(() => validateAnalysis({ ...analysis, whys: [] })));
test("期限超過を赤表示", () => assert.equal(deadline("2026-11-17", now).tone, "danger"));
test("本日期限は黄色", () => assert.equal(deadline("2026-11-18", now).tone, "warning"));
test("7日以内は黄色", () => assert.equal(deadline("2026-11-25", now).label, "あと7日"));
test("8日後は通常表示", () => assert.equal(deadline("2026-11-26", now).tone, "neutral"));
test("完了対策は超過扱いにしない", () =>
  assert.equal(deadline("2026-10-01", now, true).tone, "neutral"));
test("恒久対策なしでは日程なし", () =>
  assert.equal(effectSchedule([{ ...action, kind: "暫定対策" }], 30), null));
test("未完了の恒久対策がある場合日程なし", () =>
  assert.equal(effectSchedule([action, { ...action, status: "実施中" }], 30), null));
test("最後の恒久対策の完了日で予定算出", () =>
  assert.deepEqual(effectSchedule([action, { ...action, completed: "2026-10-10" }], 30), {
    baseline: "2026-10-10",
    due: "2026-11-09",
  }));
test("未完了では効果確認へ進めない", () =>
  assert.throws(() => transition({ ...fresh(), status: "対策実施中" }, "効果確認中", now, "担当")));
test("完了した恒久対策で効果確認へ", () =>
  assert.equal(
    transition({ ...ready(), status: "対策実施中" }, "効果確認中", now, "担当").effectDue,
    "2026-11-02",
  ));
test("対策保存で予定日自動設定", () =>
  assert.equal(
    saveAction({ ...fresh(), status: "対策実施中" }, action, now, "担当").effectDue,
    "2026-11-02",
  ));
test("未来の完了日を拒否", () =>
  assert.throws(() => saveAction(fresh(), { ...action, completed: "2027-01-01" }, now, "担当")));
test("完了メモなしを拒否", () =>
  assert.throws(() => saveAction(fresh(), { ...action, memo: "" }, now, "担当")));
test("効果確認後の対策変更を拒否", () =>
  assert.throws(() => saveAction(ready(), action, now, "担当")));
test("同じ商品と分類で類似", () =>
  assert.deepEqual(similarReasons(fresh(), fresh()), ["同じ商品・分類"]));
test("商品だけ同じでは類似にならない", () =>
  assert.deepEqual(similarReasons(fresh(), { ...fresh(), category: "接客" }), []));
test("タグ共有で類似", () =>
  assert.deepEqual(
    similarReasons({ ...fresh(), analysis }, { ...fresh(), product: "別商品", analysis }),
    ["原因タグ：検品漏れ"],
  ));
test("180日より前と自分は一覧から除外", () =>
  assert.equal(
    similarClaims(
      fresh(),
      [fresh(), { ...fresh(), id: "old", received: "2026-01-01T12:00" }],
      "2026-11-18",
    ).length,
    0,
  ));
test("効果比較は両期間と境界を正確に集計", () => {
  const c = ready();
  const list = [
    "2026-09-02",
    "2026-09-03",
    "2026-10-02",
    "2026-10-03",
    "2026-10-04",
    "2026-11-02",
    "2026-11-03",
  ].map((d, i) => ({ ...fresh(), id: `other-${i}`, received: d + "T12:00" }));
  assert.deepEqual(compareEffect(c, [c, ...list]), {
    days: 30,
    start: "2026-09-03",
    before: 2,
    after: 2,
  });
});
test("予定日前の判定を拒否", () =>
  assert.throws(() => judgeEffect(ready(), "効果あり", "担当", "確認", "2026-11-01T23:59")));
test("コメントなしの判定を拒否", () =>
  assert.throws(() => judgeEffect(ready(), "効果あり", "担当", " ", now)));
test("効果ありで完了", () =>
  assert.equal(
    judgeEffect(ready(), "効果あり", "担当", "再発なし", now).status,
    "完了（再発なし）",
  ));
test("効果なしで再分析・回数・理由を保存", () => {
  const c = judgeEffect(ready(), "効果なし", "担当", "再発を確認", now);
  assert.equal(c.status, "原因分析中");
  assert.equal(c.returns, 1);
  assert.equal(c.verdicts[0].comment, "再発を確認");
});
test("延長は30日・比較期間も延長", () => {
  const c = judgeEffect(ready(), "延長", "担当", "観察を継続", now);
  assert.equal(c.effectDue, "2026-12-02");
  assert.equal(c.status, "効果確認中");
  assert.equal(compareEffect(c, []).days, 60);
});
test("月別分類は0件の月を含む", () =>
  assert.deepEqual(
    monthly([fresh()], "2026-09-01", "2026-11-30", ["包装破損"]).map((r) => r.total),
    [0, 1, 0],
  ));
test("期間絞り込みは終了日を含む", () =>
  assert.equal(inPeriod([fresh()], "2026-10-01", "2026-10-01").length, 1));
test("パレートは件数順・累積100%", () => {
  const p = pareto(
    [
      { ...fresh(), analysis },
      { ...fresh(), analysis: { ...analysis, tags: ["検品漏れ", "手順"] } },
    ],
    "tags",
  );
  assert.equal(p[0].count, 2);
  assert.equal(p[1].cumulative, 100);
});
test("パレートは同一案件内のタグを重複計数しない", () =>
  assert.equal(
    pareto([{ ...fresh(), analysis: { ...analysis, tags: ["x", "x"] } }], "tags")[0].count,
    1,
  ));
test("再発率の母数0は0%", () => assert.equal(recurrence([], [], now).failureRate, 0));
test("効果なし率は延長を除外", () => {
  const c = judgeEffect(ready(), "効果なし", "担当", "再発", now);
  assert.equal(recurrence([c], [c], now).failureRate, 100);
});
test("90日未経過を除外", () => {
  const c = judgeEffect(ready(), "効果あり", "担当", "なし", now);
  assert.equal(recurrence([c], [c], "2026-12-01").observed, 0);
});
test("90日内の類似再発を計数", () => {
  const c = judgeEffect(ready(), "効果あり", "担当", "なし", now);
  assert.equal(
    recurrence([c], [c, { ...fresh(), id: "other", received: "2026-12-01T12:00" }], "2027-03-01")
      .recurrenceRate,
    100,
  );
});
test("CSVはBOM・引用符・改行を保存", () =>
  assert.equal(csv([["a,b", 'a"b', "改\n行"]]), '\uFEFF"a,b","a""b","改\n行"'));
test("CSV式を無効化", () => assert.equal(csv([["=SUM(A1)"]]), '\uFEFF"\'=SUM(A1)"'));
test("クレームCSVファイル名", () =>
  assert.equal(
    csvFilename("クレーム一覧", "2026-08-01", "2026-11-18"),
    "クレーム一覧_2026-08-01_2026-11-18.csv",
  ));
test("対策CSVファイル名", () =>
  assert.equal(csvFilename("再発防止策", "2026-11-18"), "再発防止策_2026-11-18.csv"));
test("傾向CSVファイル名", () =>
  assert.equal(
    csvFilename("クレーム傾向", "2026-06-01", "2026-11-18"),
    "クレーム傾向_2026-06-01_2026-11-18.csv",
  ));
test("保存データの往復", () => assert.equal(validateData(JSON.parse(JSON.stringify(data))), true));
test("破損JSONを復元", () => assert.equal(decodeStorage("{", new Date()).restored, true));
test("未知のバージョンを拒否", () => assert.equal(validateData({ ...data, version: 2 }), false));
test("重複IDを拒否", () =>
  assert.equal(validateData({ ...data, claims: [data.claims[0], data.claims[0]] }), false));
test("不正な対策を拒否", () => {
  const copy = structuredClone(data);
  copy.claims[0].actions[0].status = "不明";
  assert.equal(validateData(copy), false);
});
test("壊れた設定を拒否", () =>
  assert.equal(validateData({ ...data, settings: { ...data.settings, products: null } }), false));

for (const stamp of [
  "2026-11-18T00:01",
  "2026-11-18T04:15",
  "2026-11-18T09:05",
  "2026-11-18T12:30",
  "2026-11-18T23:59",
  "2026-12-01T00:01",
  "2026-11-30T23:59",
  "2026-12-31T23:59",
  "2027-01-01T00:01",
]) {
  test(`シードの日時・受付時間・判定整合性：${stamp}`, () => {
    const seed = createSeed(new Date(stamp + "+09:00"));
    assert.equal(seed.claims.length, 30);
    assert.equal(validateData(seed), true);
    assert.equal(new Set(seed.claims.map((c) => c.status)).size, 5);
    for (const c of seed.claims) {
      assert.ok(c.received < stamp);
      const time = c.received.slice(11);
      assert.ok(time >= (["店頭", "電話"].includes(c.channel) ? "09:00" : "07:00"));
      assert.ok(time <= (["店頭", "電話"].includes(c.channel) ? "19:00" : "23:30"));
      if (c.analysis.date) assert.ok(c.analysis.date < stamp.slice(0, 10));
      c.actions.forEach((a) => {
        if (a.completed) assert.ok(a.completed < stamp.slice(0, 10));
      });
      c.timeline.forEach((t) => {
        assert.ok(t.at < stamp);
        assert.ok(t.at >= c.received);
      });
      c.verdicts.forEach((v) => {
        assert.ok(v.at < stamp);
        assert.ok(v.at.slice(0, 10) >= v.due);
        assert.ok(v.due > v.baseline);
      });
      if (c.status === "効果確認中") assert.equal(c.verdicts.length, 0);
    }
    const open = seed.claims.flatMap((c) => c.actions).filter((a) => a.status !== "完了");
    assert.equal(open.filter((a) => a.due < stamp.slice(0, 10)).length, 2);
    assert.equal(
      open.filter((a) => deadline(a.due, stamp).days >= 0 && deadline(a.due, stamp).days <= 7)
        .length,
      1,
    );
    assert.equal(
      seed.claims.filter((c) => c.status === "効果確認中" && c.effectDue < stamp.slice(0, 10))
        .length,
      1,
    );
    if (stamp.endsWith("00:01") || stamp.includes("T04:"))
      assert.equal(seed.claims.filter((c) => c.received.startsWith(stamp.slice(0, 10))).length, 0);
  });
}
