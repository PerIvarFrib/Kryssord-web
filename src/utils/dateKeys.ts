export function getDateKeyForDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();
  return `${day}${month}${year}`;
}

export function getTodayKey(): string {
  return getDateKeyForDate(new Date());
}

export function getYesterdayKey(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return getDateKeyForDate(date);
}
