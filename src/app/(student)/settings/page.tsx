import { PageHeader } from "@/components/shared";
import { SettingsForm } from "@/features/settings/settings-form";
import { getMessages } from "@/i18n/server";

export default async function SettingsPage() {
  const copy = (await getMessages()).account.settings;
  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />
      <SettingsForm />
    </>
  );
}
