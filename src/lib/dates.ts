export function japanNow(now: Date): string {
  return new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 16);
}
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(date.slice(0, 10) + "T00:00:00Z") + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / 86400000);
}
export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}
export function validStamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    validDate(value.slice(0, 10)) &&
    /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}
export function monthsAgo(today: string, months: number): string {
  const date = new Date(today.slice(0, 7) + "-01T00:00:00Z");
  date.setUTCMonth(date.getUTCMonth() - months + 1);
  return date.toISOString().slice(0, 10);
}
