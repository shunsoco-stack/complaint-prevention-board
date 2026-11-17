import type { Data } from "./types.ts";
import { statuses, channels, severities, fourMs } from "./types.ts";
import { validDate, validStamp } from "./dates.ts";
import { createSeed } from "./seed.ts";
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === "string";
const texts = (v: unknown): v is string[] => Array.isArray(v) && v.every(text);
const dateOrEmpty = (v: unknown) => v === "" || validDate(v);
export function validateData(value: unknown): value is Data {
  if (
    !object(value) ||
    value.version !== 1 ||
    !object(value.settings) ||
    !Array.isArray(value.claims)
  )
    return false;
  const s = value.settings;
  if (
    ![s.products, s.members, s.tags].every(
      (v) => texts(v) && v.every((t) => t.trim()) && new Set(v).size === v.length,
    ) ||
    !(s.products as string[]).length ||
    !(s.members as string[]).length ||
    !Array.isArray(s.categories) ||
    !s.categories.length ||
    !s.categories.every(
      (c) =>
        object(c) &&
        text(c.name) &&
        c.name.trim() &&
        Number.isInteger(c.days) &&
        Number(c.days) > 0 &&
        Number(c.days) <= 365,
    ) ||
    new Set(s.categories.map((c) => c.name)).size !== s.categories.length
  )
    return false;
  const categories = s.categories;
  const ids = new Set<string>();
  return value.claims.every((c) => {
    if (!object(c) || !text(c.id) || !/^C-\d{4}-\d{3,}$/.test(c.id) || ids.has(c.id)) return false;
    ids.add(c.id);
    if (
      !validStamp(c.received) ||
      !channels.includes(c.channel as never) ||
      !severities.includes(c.severity as never) ||
      !statuses.includes(c.status as never) ||
      ![c.product, c.category, c.content, c.lot].every(text) ||
      !(s.products as string[]).includes(c.product as string) ||
      !categories.some((cat) => cat.name === c.category) ||
      !texts(c.photos) ||
      c.photos.length > 3 ||
      typeof c.sample !== "boolean" ||
      !object(c.analysis) ||
      !Array.isArray(c.actions) ||
      !Array.isArray(c.verdicts) ||
      !Array.isArray(c.timeline) ||
      !dateOrEmpty(c.effectDue) ||
      !dateOrEmpty(c.baseline) ||
      !Number.isInteger(c.effectDays) ||
      Number(c.effectDays) < 1 ||
      !Number.isInteger(c.returns) ||
      Number(c.returns) < 0
    )
      return false;
    const a = c.analysis;
    if (
      !texts(a.whys) ||
      a.whys.length < 1 ||
      a.whys.length > 5 ||
      !texts(a.ms) ||
      !a.ms.every((m) => fourMs.includes(m as never)) ||
      !texts(a.tags) ||
      ![a.occurrence, a.escape, a.author].every(text) ||
      !dateOrEmpty(a.date)
    )
      return false;
    if (
      !c.actions.every(
        (action) =>
          object(action) &&
          [action.id, action.content, action.owner, action.memo].every(text) &&
          ["暫定対策", "恒久対策"].includes(String(action.kind)) &&
          ["発生対策", "流出対策"].includes(String(action.target)) &&
          ["未着手", "実施中", "完了"].includes(String(action.status)) &&
          validDate(action.due) &&
          dateOrEmpty(action.completed) &&
          (action.status !== "完了" || (validDate(action.completed) && !!action.memo)),
      )
    )
      return false;
    if (
      !c.verdicts.every(
        (v) =>
          object(v) &&
          ["効果あり", "効果なし", "延長"].includes(String(v.result)) &&
          text(v.reviewer) &&
          text(v.comment) &&
          validStamp(v.at) &&
          validDate(v.due) &&
          validDate(v.baseline) &&
          Number.isInteger(v.days) &&
          Number(v.days) > 0 &&
          v.at.slice(0, 10) >= v.due &&
          v.due > v.baseline,
      )
    )
      return false;
    if (!c.timeline.every((t) => object(t) && validStamp(t.at) && text(t.who) && text(t.text)))
      return false;
    if (
      ["対策実施中", "効果確認中", "完了（再発なし）"].includes(String(c.status)) &&
      (!a.occurrence || !a.escape || !a.author || !a.date)
    )
      return false;
    if (
      ["効果確認中", "完了（再発なし）"].includes(String(c.status)) &&
      (!c.baseline ||
        !c.effectDue ||
        !c.actions.some((v) => v.kind === "恒久対策") ||
        c.actions.some((v) => v.kind === "恒久対策" && v.status !== "完了"))
    )
      return false;
    return true;
  });
}
export function decodeStorage(raw: string | null, now: Date): { data: Data; restored: boolean } {
  if (raw === null) return { data: createSeed(now), restored: false };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (validateData(parsed)) return { data: parsed, restored: false };
  } catch {
    /* 破損データは既定データへ復元する。 */
  }
  return { data: createSeed(now), restored: true };
}
