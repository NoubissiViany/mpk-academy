// Run with Node 22.18+: node --experimental-strip-types scripts/email/generate-templates.mjs
// Authentication bodies share the reminder shell; Supabase evaluates Go tokens.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";
import {
  emailParagraph,
  renderEmailLayout,
} from "../../src/lib/email/layout.ts";

const copy = {
  en: {
    confirmation: {
      eyebrow: "Email verification",
      title: "Confirm your email address.",
      preheader: "One last step to set up your MPK Academy account.",
      body: "Welcome to MPK Academy. Confirm your email address to finish setting up your account and continue your TEF or TCF Canada preparation.",
      action: "Confirm email address",
      footer:
        "If you didn’t create an MPK Academy account, you can safely ignore this email.",
    },
    recovery: {
      eyebrow: "Account security",
      title: "Reset your password.",
      preheader: "Use this secure link to choose a new MPK Academy password.",
      body: "We received a request to reset the password for your MPK Academy account. Use the button below to choose a new one.",
      action: "Choose a new password",
      footer:
        "Didn’t request a password reset? You can safely ignore this email. Your current password will stay the same.",
    },
    magic_link: {
      eyebrow: "Secure sign-in",
      title: "Your sign-in code.",
      preheader: "Your one-time code for MPK Academy is ready.",
      body: "Use this one-time code to sign in to your MPK Academy account, or use the secure sign-in button below.",
      action: "Sign in securely",
      footer:
        "If you didn’t request this code, you can safely ignore this email. Never share your sign-in code with anyone.",
    },
  },
  fr: {
    confirmation: {
      eyebrow: "Vérification du courriel",
      title: "Confirmez votre adresse courriel.",
      preheader: "Une dernière étape pour créer votre compte MPK Academy.",
      body: "Bienvenue sur MPK Academy. Confirmez votre adresse courriel pour terminer la création de votre compte et poursuivre votre préparation au TEF ou au TCF Canada.",
      action: "Confirmer mon adresse",
      footer:
        "Si vous n’avez pas créé de compte MPK Academy, vous pouvez simplement ignorer ce courriel.",
    },
    recovery: {
      eyebrow: "Sécurité du compte",
      title: "Réinitialisez votre mot de passe.",
      preheader:
        "Un lien sécurisé pour choisir un nouveau mot de passe MPK Academy.",
      body: "Nous avons reçu une demande de réinitialisation du mot de passe de votre compte MPK Academy. Utilisez le bouton ci-dessous pour en choisir un nouveau.",
      action: "Choisir un mot de passe",
      footer:
        "Vous n’avez pas demandé cette réinitialisation ? Ignorez simplement ce courriel. Votre mot de passe actuel reste inchangé.",
    },
    magic_link: {
      eyebrow: "Connexion sécurisée",
      title: "Votre code de connexion.",
      preheader: "Votre code à usage unique pour MPK Academy est prêt.",
      body: "Utilisez ce code à usage unique pour vous connecter à votre compte MPK Academy, ou utilisez le bouton de connexion sécurisée ci-dessous.",
      action: "Me connecter",
      footer:
        "Si vous n’avez pas demandé ce code, ignorez simplement ce courriel. Ne partagez jamais votre code de connexion.",
    },
  },
};

function render(type, locale) {
  const fr = locale === "fr";
  const text = copy[locale][type];
  const url =
    type === "magic_link"
      ? "{{ .ConfirmationURL }}"
      : type === "confirmation"
        ? "{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email&next=/auth/complete"
        : "{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery&next=/update-password";
  const greeting = `{{ with .Data.first_name }}${fr ? "Bonjour" : "Hello"} {{ . }},{{ else }}${fr ? "Bonjour" : "Hello"},{{ end }}`;
  const code =
    type === "magic_link"
      ? `<table role="presentation" class="email-panel" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background-color:#eef3ec;border:1px solid #d9ddd6;border-radius:8px"><tr><td align="center" style="padding:22px 12px"><p class="email-accent" style="margin:0 0 10px;font-size:11px;line-height:16px;letter-spacing:1px;font-weight:bold;color:#12634f;text-transform:uppercase">${fr ? "Code à usage unique" : "One-time code"}</p><p class="email-code" style="margin:0;font-family:Consolas,'Courier New',monospace;font-size:34px;line-height:44px;letter-spacing:6px;font-weight:bold;color:#152720">{{ .Token }}</p></td></tr></table>`
      : "";
  return renderEmailLayout({
    locale,
    ...text,
    contentHtml: emailParagraph(greeting) + emailParagraph(text.body) + code,
    action: { label: text.action, url },
    afterActionHtml:
      type === "magic_link"
        ? ""
        : `<p class="email-copy" style="margin:18px 0 0;font-size:13px;line-height:21px;color:#42534a">${fr ? "Ce lien sécurisé est à usage unique." : "This secure link can only be used once."}</p>`,
    footerHtml: `<p style="margin:0">${text.footer}</p>`,
  });
}

for (const type of ["confirmation", "recovery", "magic_link"]) {
  const html = `{{ if eq .Data.locale "fr" }}\n${render(type, "fr")}\n{{ else }}\n${render(type, "en")}\n{{ end }}\n`;
  const path = fileURLToPath(
    new URL(`../../supabase/templates/${type}.html`, import.meta.url),
  );
  const formatted = await format(html, {
    ...(await resolveConfig(path)),
    filepath: path,
  });
  writeFileSync(path, formatted);
  console.log(`Generated ${type}.html`);
}
