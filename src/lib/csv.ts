export function csv(rows: (string | number)[][]): string {
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((cell) => {
            const text = String(cell);
            const safe = /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
            return '"' + safe.replaceAll('"', '""') + '"';
          })
          .join(","),
      )
      .join("\r\n")
  );
}
export function csvFilename(
  kind: "クレーム一覧" | "再発防止策" | "クレーム傾向",
  start: string,
  end?: string,
) {
  return `${kind}_${start}${end ? `_${end}` : ""}.csv`;
}
export function downloadCsv(name: string, rows: (string | number)[][]) {
  const url = URL.createObjectURL(new Blob([csv(rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
