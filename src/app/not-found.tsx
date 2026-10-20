import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n/server";

export default async function NotFound() {
  const copy = (await getMessages()).common.notFoundPage;
  return (
    <main className="container-page py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl font-bold">{copy.title}</h1>
      <p className="mt-4 text-muted-foreground">{copy.body}</p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/dashboard">{copy.dashboard}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">{copy.home}</Link>
        </Button>
      </div>
    </main>
  );
}
