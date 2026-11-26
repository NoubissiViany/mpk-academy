export const defaultTimeZone = "America/Toronto";
export function validTimeZone(value: string) {
  if (value.length > 100) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
export function localClock(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    hour: Number(part("hour")),
  };
}
export function calendarDaysUntil(date: string, now: Date, timeZone: string) {
  return Math.round(
    (Date.parse(date + "T00:00:00Z") -
      Date.parse(localClock(now, timeZone).date + "T00:00:00Z")) /
      86_400_000,
  );
}
