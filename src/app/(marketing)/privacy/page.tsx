import { contactEmail } from "@/config/product";
import { PrivacyNotice } from "@/features/legal/privacy-notice";
import { getLocale, getMessages } from "@/i18n/server";

export async function generateMetadata() {
  const t = (await getMessages()).metadata;
  return { title: t.privacy, description: t.privacyDescription };
}

export default async function PrivacyPage() {
  return (
    <div className="container-page py-16">
      <PrivacyNotice locale={await getLocale()} contactEmail={contactEmail()} />
    </div>
  );
}
