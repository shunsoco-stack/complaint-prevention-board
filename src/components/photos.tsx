"use client";
import { useEffect, useState } from "react";
import { photoStore } from "@/lib/files";
export function Photos({ ids, sample }: { ids: string[]; sample: boolean }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const created: string[] = [];
    Promise.all(ids.map((id) => photoStore("get", id)))
      .then((blobs) => {
        blobs.forEach((b) => {
          if (b) created.push(URL.createObjectURL(b));
        });
        if (active) {
          setUrls(created);
          if (created.length !== ids.length) setError("一部の写真が見つかりません。");
        } else created.forEach((url) => URL.revokeObjectURL(url));
      })
      .catch(() => {
        if (active) setError("写真を読み込めませんでした。");
      });
    return () => {
      active = false;
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [ids]);
  return (
    <div className="photos">
      {sample && (
        <figure className="sample-photo">
          <svg viewBox="0 0 240 150" role="img" aria-label="架空のギフト缶のイラスト">
            <rect width="240" height="150" fill="#eee8da" />
            <ellipse cx="120" cy="121" rx="73" ry="12" fill="#d3cab9" />
            <path d="M52 49L119 27L188 49V107L121 128L52 106Z" fill="#668377" />
            <path d="M52 49L119 27L188 49L120 74Z" fill="#a2baaa" />
            <path d="M120 74V128M162 57L162 114" stroke="#f3e4b9" strokeWidth="8" />
            <text x="85" y="54" fill="#314c40" fontSize="12">
              KOMOREBI
            </text>
          </svg>
          <figcaption>サンプル画像（架空）</figcaption>
        </figure>
      )}
      {urls.map((url, i) => (
        <a key={url} href={url} target="_blank" rel="noreferrer">
          <picture>
            <img src={url} alt={`添付写真 ${i + 1}`} />
          </picture>
        </a>
      ))}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
