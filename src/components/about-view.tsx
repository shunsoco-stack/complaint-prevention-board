"use client";
import { useStore } from "./store";
import { Heading } from "./ui";
import { createSeed } from "@/lib/seed";
import { photoStore } from "@/lib/files";
export default function AboutView() {
  const { data, update, notice } = useStore();
  async function reset(photosOnly: boolean) {
    if (
      !window.confirm(
        photosOnly
          ? "保存した写真とサンプル表示をすべて削除しますか？"
          : "現在の記録と写真を削除し、既定データに戻しますか？",
      )
    )
      return;
    try {
      await photoStore("clear");
      update(
        photosOnly
          ? { ...data, claims: data.claims.map((c) => ({ ...c, photos: [], sample: false })) }
          : createSeed(new Date()),
      );
      notice(
        photosOnly
          ? "すべての写真を削除しました。"
          : "現在の日本時間を基準に既定データへ戻しました。",
      );
    } catch (e) {
      notice((e as Error).message);
    }
  }
  return (
    <>
      <Heading
        eyebrow="ABOUT THIS DEMO"
        title="このデモについて"
        text="お客様の声を、継続的な品質改善につなげるためのデモです。"
      />
      <section className="panel form-panel prose">
        <h2>こもれび菓子工房（架空）</h2>
        <p>
          登場する事業者・商品・メンバー・クレームはすべて架空です。実在の企業・商品・個人とは関係ありません。写真のサンプルは、アプリ内で描いた架空のイラストです。
        </p>
        <h2>一次対応の、その先を扱います</h2>
        <p>
          発生原因と流出原因を分けて分析し、再発防止策に担当者と期限を設定します。対策完了後は一定期間をおき、類似クレームの件数と作業状況から効果を確かめます。
        </p>
        <p>
          返信・謝罪文の作成、やり取りの履歴、返金・交換、設備の修理、AIによる分類や外部通知は扱いません。個人情報は入力しないでください。
        </p>
        <h2>保存先</h2>
        <p>
          クレームと設定は、このブラウザのlocalStorage（キー：cpb:v1）に保存します。
          添付写真は縮小してIndexedDB（DB名：cpb-photos）に保存します。
          外部API・認証・サーバーのデータベースは使用しません。
        </p>
        <p>
          ブラウザのデータを削除すると記録も消えます。端末やブラウザ間で同期されません。CSVには写真を含みません。同じブラウザでは一つのタブで編集してください。
        </p>
        <h2>日時と効果確認</h2>
        <p>
          日本時間を使用します。初期データは初回に開いた日時を基準に生成し、その後は保存した記録を維持します。
          対策前後の比較は対策完了日を除き、前後それぞれ同じ日数で集計します。
          延長では予定日を30日延ばし、比較の前期間も同じ日数へ拡張します。
        </p>
        <h2>データの管理</h2>
        <p>以下の操作は取り消せません。必要な一覧は先にCSVで保存してください。</p>
        <div className="button-row">
          <button onClick={() => void reset(true)}>写真をすべて削除</button>
          <button className="danger-button" onClick={() => void reset(false)}>
            既定データに戻す
          </button>
        </div>
      </section>
    </>
  );
}
