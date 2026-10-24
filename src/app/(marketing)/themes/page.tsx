import { redirect } from "next/navigation";
import { getLocale } from "@/i18n/server";

/** Each language has its own address, so both can be found by search engines. */
export default async function ThemesPage() {
  redirect(`/themes/${await getLocale()}`);
}
