import type { Analysis } from "./types.ts";
import { validDate } from "./dates.ts";
export function addWhy(whys: string[]): string[] {
  if (whys.length >= 5) throw new Error("なぜは最大5段です。");
  return [...whys, ""];
}
export function validateAnalysis(value: Analysis): void {
  if (value.whys.length < 1 || value.whys.length > 5) throw new Error("なぜは1〜5段です。");
  if (!value.occurrence.trim() || !value.escape.trim()) {
    throw new Error("発生原因と流出原因の両方を入力してください。");
  }
  if (!value.author || !validDate(value.date))
    throw new Error("分析者と分析日を入力してください。");
}
