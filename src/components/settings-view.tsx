"use client";
import { useState } from "react";
import { useStore } from "./store";
import { Heading } from "./ui";
import { validateData } from "@/lib/storage";
import type { Settings } from "@/lib/types";
export default function SettingsView() {
  const { data, update, notice } = useStore();
  const [settings, setSettings] = useState<Settings>(structuredClone(data.settings));
  const [error, setError] = useState("");
  const [add, setAdd] = useState({ products: "", categories: "", tags: "", members: "" });
  function save() {
    try {
      const rename = (field: "products" | "tags" | "members", value: string) => {
        const index = data.settings[field].indexOf(value);
        return index >= 0 ? (settings[field][index] ?? value) : value;
      };
      const claims = data.claims.map((c) => ({
        ...c,
        product: rename("products", c.product),
        category:
          settings.categories[data.settings.categories.findIndex((cat) => cat.name === c.category)]
            ?.name ?? c.category,
        analysis: {
          ...c.analysis,
          tags: c.analysis.tags.map((t) => rename("tags", t)),
          author: rename("members", c.analysis.author),
        },
        actions: c.actions.map((a) => ({ ...a, owner: rename("members", a.owner) })),
      }));
      const next = { ...data, settings, claims };
      if (!validateData(next))
        throw new Error("空欄・重複をなくし、確認期間を1〜365日の整数にしてください。");
      update(next);
      setError("");
      notice("設定を保存しました。確認期間の変更は新規登録に適用されます。");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <Heading
        eyebrow="SETTINGS"
        title="設定"
        text="商品・分類・原因タグ・メンバーを管理します。"
      />
      <p className="info-banner">
        名称変更は既存の関連データにも反映します。過去の判定・タイムラインは記録時の名前を保持します。
      </p>
      <div className="two-columns">
        {(["products", "categories", "tags", "members"] as const).map((field) => (
          <section className="panel form-panel" key={field}>
            <h2>
              {
                {
                  products: "商品マスタ",
                  categories: "分類・確認期間",
                  tags: "原因タグ",
                  members: "メンバー",
                }[field]
              }
            </h2>
            {settings[field].map((entry, i) => (
              <div className="setting-row" key={i}>
                <input
                  aria-label={`${field} ${i + 1} 名称`}
                  value={typeof entry === "string" ? entry : entry.name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      [field]: settings[field].map((v, n) =>
                        n === i
                          ? typeof v === "string"
                            ? e.target.value
                            : { ...v, name: e.target.value }
                          : v,
                      ),
                    })
                  }
                />
                {typeof entry !== "string" && (
                  <label className="days-input">
                    <input
                      aria-label={`${entry.name}の確認期間`}
                      type="number"
                      min="1"
                      max="365"
                      value={entry.days}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          categories: settings.categories.map((c, n) =>
                            n === i ? { ...c, days: Number(e.target.value) } : c,
                          ),
                        })
                      }
                    />
                    日
                  </label>
                )}
              </div>
            ))}
            <div className="inline-form">
              <input
                aria-label={`${field}に追加する名称`}
                placeholder="名称を入力して追加"
                value={add[field]}
                onChange={(e) => setAdd({ ...add, [field]: e.target.value })}
              />
              <button
                onClick={() => {
                  if (!add[field].trim()) return;
                  setSettings({
                    ...settings,
                    [field]: [
                      ...settings[field],
                      field === "categories"
                        ? { name: add[field].trim(), days: 30 }
                        : add[field].trim(),
                    ],
                  });
                  setAdd({ ...add, [field]: "" });
                }}
              >
                ＋ 追加
              </button>
            </div>
            <small className="muted">
              記録との対応を保つため、既存項目は名称編集で管理します。
            </small>
          </section>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-footer">
        <button className="primary" onClick={save}>
          設定を保存
        </button>
      </div>
    </>
  );
}
