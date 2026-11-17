"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "./store";
import { Heading, Select, ClaimList } from "./ui";
import { emptyClaim, registerClaim } from "@/lib/claims";
import { channels, severities } from "@/lib/types";
import { japanNow } from "@/lib/dates";
import { similarClaims } from "@/lib/similar";
import { photoStore, resizePhoto } from "@/lib/files";
export default function NewClaim() {
  const { data, now, saveClaim, notice } = useStore();
  const [claim, setClaim] = useState(() => emptyClaim(now));
  const [who, setWho] = useState(data.settings.members[0]);
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const patch = (key: string, value: string) => setClaim({ ...claim, [key]: value });
  const candidates =
    claim.product && claim.category ? similarClaims(claim, data.claims, now.slice(0, 10)) : [];
  async function attach(files: FileList | null) {
    if (!files) return;
    setError("");
    if (files.length > 3) {
      setError("写真は最大3枚です。");
      return;
    }
    setBusy(true);
    try {
      const images = await Promise.all(Array.from(files).map(resizePhoto));
      setBlobs(images);
      const urls = await Promise.all(
        images.map(
          (blob) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.readAsDataURL(blob);
            }),
        ),
      );
      setPreviews(urls);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const ids: string[] = [];
    try {
      const next = registerClaim(
        {
          ...claim,
          effectDays: data.settings.categories.find((c) => c.name === claim.category)?.days ?? 30,
        },
        data.claims,
        japanNow(new Date()),
        who,
      );
      for (const blob of blobs) {
        const id = crypto.randomUUID();
        await photoStore("put", id, blob);
        ids.push(id);
      }
      saveClaim({ ...next, photos: ids });
      notice(`${next.id} を登録しました。`);
      router.push(`/claims/${next.id}`);
    } catch (e) {
      await Promise.all(ids.map((id) => photoStore("delete", id)));
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="NEW CLAIM"
        title="クレームを登録"
        text="一次対応が済んだ商品・サービスへのクレームを記録します。"
      />
      <form onSubmit={submit} className="panel form-panel">
        <h2>お客様の声を記録する</h2>
        <p className="muted">氏名・連絡先などの個人情報は入力しないでください。</p>
        <div className="form-grid">
          <label className="field">
            受付日時 *
            <input
              required
              type="datetime-local"
              max={now}
              value={claim.received}
              onChange={(e) => patch("received", e.target.value)}
            />
          </label>
          <Select
            label="受付経路"
            value={claim.channel}
            onChange={(v) => patch("channel", v)}
            options={channels}
          />
          <Select
            label="商品 *"
            value={claim.product}
            onChange={(v) => patch("product", v)}
            options={data.settings.products}
            placeholder="選択してください"
            required
          />
          <Select
            label="分類 *"
            value={claim.category}
            onChange={(v) => patch("category", v)}
            options={data.settings.categories.map((c) => c.name)}
            placeholder="選択してください"
            required
          />
          <Select
            label="重大度"
            value={claim.severity}
            onChange={(v) => patch("severity", v)}
            options={severities}
          />
          <label className="field">
            ロット番号または販売店舗（任意）
            <input value={claim.lot} onChange={(e) => patch("lot", e.target.value)} />
          </label>
        </div>
        <label className="field">
          内容 *
          <textarea
            required
            rows={4}
            placeholder="お客様から届いた内容と、確認できた事実を記録してください。"
            value={claim.content}
            onChange={(e) => patch("content", e.target.value)}
          />
        </label>
        <div className="file-picker">
          <input
            className="visually-hidden"
            id="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => void attach(e.target.files)}
          />
          <label className="button" htmlFor="photos">
            ＋ 写真を添付（最大3枚）
          </label>
          <span>{blobs.length}枚添付済み</span>
          <small>JPEG・PNG・WebP / 各20MB以下 / ブラウザ内で縮小</small>
        </div>
        <div className="photos">
          {previews.map((src, i) => (
            <picture key={i}>
              <img src={src} alt={`選択した写真 ${i + 1}`} />
            </picture>
          ))}
        </div>
        {blobs.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setBlobs([]);
              setPreviews([]);
            }}
          >
            添付を取り消す
          </button>
        )}
        <Select label="記録者" value={who} onChange={setWho} options={data.settings.members} />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-footer">
          <button className="primary" disabled={busy}>
            {busy ? "処理中…" : "登録して原因分析へ"}
          </button>
        </div>
      </form>
      {claim.product && claim.category && (
        <section className="panel">
          <div className="panel-heading">
            <h2>類似候補（直近180日）</h2>
            <span className="muted">同じ商品・分類</span>
          </div>
          <ClaimList claims={candidates} />
        </section>
      )}
    </>
  );
}
