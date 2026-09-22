export const productionAppUrl = "https://mpk-academy.vercel.app";

export function getAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  return process.env.NODE_ENV === "production"
    ? productionAppUrl
    : "http://localhost:3000";
}
