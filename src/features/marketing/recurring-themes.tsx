import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { themeIssues, type ThemeIssue } from "@/content/themes";
import { intlLocale, type Locale } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

const monthName = (month: string, lang: Locale) =>
  new Intl.DateTimeFormat(intlLocale(lang), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));

/** The page's language comes from its address, not the visitor's setting. */
export function RecurringThemes({ lang }: { lang: Locale }) {
  const t = messagesFor(lang).themes;
  const [latest, ...earlier] = themeIssues;
  return (
    <article lang={lang} className="container-page max-w-4xl py-16">
      <header>
        <p className="eyebrow">{t.eyebrow(monthName(latest.month, lang))}</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{t.title}</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          {latest.intro[lang]}
        </p>
        <p className="mt-4 rounded-xl border border-dashed p-4 text-sm leading-6 text-muted-foreground">
          {t.notice}
        </p>
        <Link
          href={`/themes/${lang === "fr" ? "en" : "fr"}`}
          hrefLang={lang === "fr" ? "en" : "fr"}
          className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
        >
          {t.otherLanguage}
        </Link>
      </header>

      <Issue issue={latest} lang={lang} />

      {earlier.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold">{t.previous}</h2>
          {earlier.map((issue) => (
            <div key={issue.month} id={issue.month} className="mt-8">
              <h3 className="text-xl font-bold capitalize">
                {monthName(issue.month, lang)}
              </h3>
              <Issue issue={issue} lang={lang} />
            </div>
          ))}
        </section>
      )}

      <Card className="mt-14 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <h2 className="text-xl font-bold">{t.ctaTitle}</h2>
          <p className="mt-2 leading-7 text-muted-foreground">{t.ctaBody}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/diagnostic">
                {t.ctaPrimary} <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/register">{t.ctaSecondary}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}

function Issue({ issue, lang }: { issue: ThemeIssue; lang: Locale }) {
  const t = messagesFor(lang).themes;
  return (
    <div className="mt-10 space-y-6">
      {issue.themes.map((theme) => (
        <Card key={theme.id} id={`${issue.month}-${theme.id}`}>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold">{theme.name[lang]}</h2>
            <p className="mt-2 leading-7">
              <span className="font-semibold">{t.why} · </span>
              {theme.why[lang]}
            </p>
            <h3 className="mt-5 text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {t.expressions}
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2" lang="fr">
              {theme.expressions.map((expression) => (
                <li key={expression}>
                  <Badge>{expression}</Badge>
                </li>
              ))}
            </ul>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {t.prompts}
            </h3>
            <ol className="mt-3 space-y-4">
              {theme.prompts.map((prompt) => (
                <li key={prompt.text} className="rounded-xl border p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">
                    {prompt.task[lang]}
                  </p>
                  <p lang="fr" className="mt-2 leading-7">
                    {prompt.text}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
