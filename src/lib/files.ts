function openPhotos(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("cpb-photos", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("写真の保存先を開けませんでした。"));
  });
}
export async function photoStore(
  operation: "get" | "put" | "clear" | "delete",
  id = "",
  blob?: Blob,
): Promise<Blob | undefined> {
  const db = await openPhotos();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("photos", operation === "get" ? "readonly" : "readwrite");
    const store = tx.objectStore("photos");
    const request =
      operation === "get"
        ? store.get(id)
        : operation === "put"
          ? store.put(blob, id)
          : operation === "delete"
            ? store.delete(id)
            : store.clear();
    tx.oncomplete = () => {
      db.close();
      resolve(request.result as Blob | undefined);
    };
    tx.onerror = () => {
      db.close();
      reject(new Error("写真の保存・読み込みに失敗しました。"));
    };
  });
}
export async function resizePhoto(file: File): Promise<Blob> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 20 * 1024 * 1024
  ) {
    throw new Error("20MB以下のJPEG・PNG・WebP画像を選択してください。");
  }
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("画像を縮小できませんでした。"))),
      "image/jpeg",
      0.82,
    ),
  );
}
