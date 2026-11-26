import { verifyUnsubscribe } from "@/lib/server/reminders/token";
import { createAdminClient } from "@/lib/supabase/admin";
import { escapeHtml } from "@/lib/reminders/email";
export const dynamic = "force-dynamic";
function page(body: string, fr: boolean, status = 200) {
  return new Response(
    `<!doctype html><html lang="${fr ? "fr" : "en"}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>MPK Academy</title></head><body style="font:18px/1.6 system-ui;background:#f4f7f4;color:#183528;margin:0"><main style="max-width:560px;margin:40px auto;padding:24px"><h1>MPK Academy</h1>${body}</main></body></html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
      },
    },
  );
}
function parse(request: Request) {
  return verifyUnsubscribe(
    new URL(request.url).searchParams.get("token") ?? "",
  );
}
export async function GET(request: Request) {
  const claims = parse(request);
  if (!claims)
    return page(
      '<p>This link is invalid. / Ce lien est invalide.</p><a href="/email-preferences">Email preferences / Préférences de courriel</a>',
      false,
      400,
    );
  const fr = claims.locale === "fr";
  // Mail scanners may follow GET links. Only an explicit POST changes consent.
  const action = new URL(request.url).pathname + new URL(request.url).search;
  return page(
    `<p>${fr ? "Désactiver vos rappels d’étude ? Les courriels de sécurité de votre compte continueront." : "Turn off study reminders? You will still receive account security emails."}</p><form method="post" action="${escapeHtml(action)}"><button style="font:inherit;padding:12px 20px;color:white;background:#183528;border:0;border-radius:8px" type="submit">${fr ? "Me désabonner" : "Unsubscribe"}</button></form>`,
    fr,
  );
}
export async function POST(request: Request) {
  const claims = parse(request);
  if (!claims) return page("<p>Invalid link / Lien invalide</p>", false, 400);
  const db = createAdminClient();
  const { data, error } = await db.rpc("mpk_unsubscribe_reminders", {
    p_user_id: claims.userId,
    p_version: claims.version,
  });
  if (error)
    return page(
      "<p>Please retry. / Veuillez réessayer.</p>",
      claims.locale === "fr",
      503,
    );
  const fr = claims.locale === "fr";
  return page(
    `<p>${data ? (fr ? "Vos rappels d’étude sont désactivés." : "Your study reminders are turned off.") : fr ? "Vos préférences ont changé depuis la création de ce lien. Gérez-les ci-dessous." : "Your preferences have changed since this link was created. Manage them below."}</p><a href="/email-preferences">${fr ? "Préférences de courriel" : "Email preferences"}</a>`,
    fr,
    data ? 200 : 409,
  );
}
