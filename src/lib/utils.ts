import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function formatDate(value: string, locale = "en-CA") {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(value),
  );
}
