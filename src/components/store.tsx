"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Claim, Data } from "@/lib/types";
import { decodeStorage } from "@/lib/storage";
import { japanNow } from "@/lib/dates";
type Store = {
  data: Data;
  now: string;
  update: (next: Data) => void;
  saveClaim: (claim: Claim) => void;
  notice: (text: string) => void;
};
const Context = createContext<Store | null>(null);
export function Provider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data | null>(null);
  const [now, setNow] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      const date = new Date();
      setNow(japanNow(date));
      try {
        const result = decodeStorage(localStorage.getItem("cpb:v1"), date);
        localStorage.setItem("cpb:v1", JSON.stringify(result.data));
        setData(result.data);
        if (result.restored) setMessage("保存データの破損を検出したため、既定データに戻しました。");
      } catch {
        setData(decodeStorage(null, date).data);
        setMessage("ブラウザ保存を利用できません。変更はこの画面を閉じると失われます。");
      }
    }, 0);
    const clock = setInterval(() => setNow(japanNow(new Date())), 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(clock);
    };
  }, []);
  function update(next: Data) {
    try {
      localStorage.setItem("cpb:v1", JSON.stringify(next));
    } catch {
      throw new Error(
        "保存容量が不足しているか、ブラウザ保存が無効です。変更は保存されていません。",
      );
    }
    setData(next);
  }
  if (!data) return <div className="loading">品質改善ボードを読み込んでいます…</div>;
  return (
    <Context.Provider
      value={{
        data,
        now,
        update,
        notice: setMessage,
        saveClaim: (claim) =>
          update({
            ...data,
            claims: data.claims.some((c) => c.id === claim.id)
              ? data.claims.map((c) => (c.id === claim.id ? claim : c))
              : [...data.claims, claim],
          }),
      }}
    >
      {message && (
        <div className="notice" role="status">
          {message}
          <button onClick={() => setMessage("")} aria-label="通知を閉じる">
            ×
          </button>
        </div>
      )}
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("Provider is required");
  return store;
}
