import type { Action, Claim, Verdict } from "./types.ts";

export type SeedAction = Pick<Action, "kind" | "target" | "content"> & {
  owner: number;
  due: number;
  done?: number;
  memo?: string;
};
export type Story = Pick<Claim, "channel" | "category" | "content" | "lot" | "status"> & {
  age: number;
  time: string;
  product: number;
  whys: string[];
  ms: string[];
  occurrence: string;
  escape: string;
  tags: string[];
  actions: SeedAction[];
  baseline?: number;
  verdict?: Verdict["result"];
  comment?: string;
};
