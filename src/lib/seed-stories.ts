import type { Data } from "./types.ts";
import { historyStories } from "./seed-history.ts";
import { giftStories } from "./seed-gifts.ts";
import { recentStories } from "./seed-recent.ts";
import { ongoingStories } from "./seed-ongoing.ts";

export const settings: Data["settings"] = {
  products: [
    "焦がしバターフィナンシェ",
    "はちみつマドレーヌ",
    "こもれびギフト缶",
    "季節のタルト",
    "発酵バタークッキー",
    "店頭サービス",
    "レモンパウンド",
    "焼き菓子詰め合わせ",
  ],
  categories: [
    {
      name: "異物混入",
      days: 30,
    },
    {
      name: "品質（味・食感）",
      days: 30,
    },
    {
      name: "包装破損",
      days: 30,
    },
    {
      name: "表示ミス",
      days: 30,
    },
    {
      name: "配送",
      days: 30,
    },
    {
      name: "接客",
      days: 30,
    },
    {
      name: "その他",
      days: 30,
    },
  ],
  tags: [
    "緩衝材不足",
    "旧版ラベル残存",
    "焼成温度ばらつき",
    "湿度管理",
    "計量ミス",
    "異物の持ち込み",
    "伝票転記ミス",
    "教育不足",
    "確認表の項目漏れ",
    "保管場所の混在",
  ],
  members: [
    "青木 葵（品質）",
    "森田 翔（製造）",
    "小林 花（製造）",
    "佐藤 凪（店舗）",
    "高橋 澪（通販）",
  ],
};

export const stories = [...historyStories, ...giftStories, ...recentStories, ...ongoingStories];
