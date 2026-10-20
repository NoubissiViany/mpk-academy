import { AuthComplete } from "@/features/auth/auth-complete";
import { getMessages } from "@/i18n/server";

export async function generateMetadata() {
  return {
    title: (await getMessages()).metadata.authComplete,
    robots: { index: false },
  };
}

export default function AuthCompletePage() {
  return <AuthComplete />;
}
