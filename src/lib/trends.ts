import type { Claim } from "./types.ts";
import { addDays } from "./dates.ts";
import { similarReasons } from "./similar.ts";
export function inPeriod(claims: Claim[], start: string, end: string) {
  return claims.filter((c) => c.received.slice(0, 10) >= start && c.received.slice(0, 10) <= end);
}
export function monthly(claims: Claim[], start: string, end: string, categories: string[]) {
  const rows: { month: string; counts: number[]; total: number }[] = [];
  const date = new Date(start.slice(0, 7) + "-01T00:00:00Z");
  while (date.toISOString().slice(0, 7) <= end.slice(0, 7) && rows.length < 120) {
    const month = date.toISOString().slice(0, 7);
    const subset = inPeriod(claims, start, end).filter((c) => c.received.startsWith(month));
    rows.push({
      month,
      counts: categories.map((category) => subset.filter((c) => c.category === category).length),
      total: subset.length,
    });
    date.setUTCMonth(date.getUTCMonth() + 1);
  }
  return rows;
}
export function pareto(claims: Claim[], field: "ms" | "tags") {
  const counts = new Map<string, number>();
  claims.forEach((c) =>
    new Set(c.analysis[field]).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)),
  );
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  let sum = 0;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => {
      sum += count;
      return { name, count, cumulative: total ? (sum / total) * 100 : 0 };
    });
}
export function recurrence(claims: Claim[], all: Claim[], today: string) {
  const verdicts = claims.flatMap((c) => c.verdicts).filter((v) => v.result !== "延長");
  const failed = verdicts.filter((v) => v.result === "効果なし").length;
  const completed = claims.flatMap((c) =>
    c.verdicts
      .filter((v) => v.result === "効果あり" && addDays(v.at, 90) <= today)
      .map((v) => ({ c, v })),
  );
  const repeated = completed.filter(({ c, v }) =>
    all.some(
      (other) =>
        other.id !== c.id &&
        other.received > v.at &&
        other.received.slice(0, 10) <= addDays(v.at, 90) &&
        similarReasons(c, other).length,
    ),
  ).length;
  return {
    failed,
    judged: verdicts.length,
    failureRate: verdicts.length ? (failed / verdicts.length) * 100 : 0,
    repeated,
    observed: completed.length,
    recurrenceRate: completed.length ? (repeated / completed.length) * 100 : 0,
  };
}
