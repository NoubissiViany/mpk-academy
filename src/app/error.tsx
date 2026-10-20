"use client";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  const copy = t.common.errorPage;
  return (
    <main className="container-page py-20 text-center">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1 className="mt-3 text-3xl font-bold">{copy.title}</h1>
      <p className="mt-3 text-muted-foreground">{copy.body}</p>
      <Button className="mt-7" onClick={reset}>
        {t.common.tryAgain}
      </Button>
    </main>
  );
}
