export const statuses = [
  "分析待ち",
  "原因分析中",
  "対策実施中",
  "効果確認中",
  "完了（再発なし）",
] as const;
export type Status = (typeof statuses)[number];
export const channels = ["店頭", "電話", "メール", "通販レビュー"] as const;
export const severities = ["軽微", "中", "重大"] as const;
export const fourMs = ["人", "設備", "材料", "方法"] as const;
export type Action = {
  id: string;
  kind: "暫定対策" | "恒久対策";
  target: "発生対策" | "流出対策";
  content: string;
  owner: string;
  due: string;
  status: "未着手" | "実施中" | "完了";
  completed: string;
  memo: string;
};
export type Analysis = {
  whys: string[];
  ms: string[];
  occurrence: string;
  escape: string;
  tags: string[];
  author: string;
  date: string;
};
export type Verdict = {
  result: "効果あり" | "効果なし" | "延長";
  reviewer: string;
  comment: string;
  at: string;
  due: string;
  baseline: string;
  days: number;
};
export type Claim = {
  id: string;
  received: string;
  channel: string;
  product: string;
  category: string;
  severity: string;
  content: string;
  lot: string;
  photos: string[];
  sample: boolean;
  status: Status;
  analysis: Analysis;
  actions: Action[];
  effectDue: string;
  effectDays: number;
  baseline: string;
  verdicts: Verdict[];
  returns: number;
  timeline: { at: string; who: string; text: string }[];
};
export type Settings = {
  products: string[];
  categories: { name: string; days: number }[];
  tags: string[];
  members: string[];
};
export type Data = { version: 1; claims: Claim[]; settings: Settings };
