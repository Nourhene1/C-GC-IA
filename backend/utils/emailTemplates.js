// Modèles d'emails en français et en anglais.
// Chaque fonction renvoie { subject, text, html }.

const escapeHtml = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const STATUS_LABELS = {
  fr: {
    brouillon: "Brouillon",
    en_attente: "En attente de validation",
    valide: "Validé",
    rejete: "Rejeté",
    en_revision: "En révision",
  },
  en: {
    brouillon: "Draft",
    en_attente: "Pending review",
    valide: "Approved",
    rejete: "Rejected",
    en_revision: "Changes requested",
  },
};

// Mise en page commune aux couleurs du logo
function layout({ title, paragraphs, button }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;line-height:1.6">${p}</p>`).join("");
  const cta = button
    ? `<p style="margin:24px 0"><a href="${button.url}" style="background:#E87722;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block">${escapeHtml(button.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#F5F7FA;font-family:Arial,sans-serif;color:#1F2937">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
      <tr><td style="background:#173A63;color:#fff;padding:20px 28px;font-weight:800;font-size:18px">
        COMPÉTITION IA &amp; GC <span style="color:#E87722">2026</span>
      </td></tr>
      <tr><td style="padding:28px">
        <h1 style="margin:0 0 18px;font-size:20px;color:#173A63">${escapeHtml(title)}</h1>
        ${body}${cta}
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function build(locale, { subject, title, lines, button }) {
  const html = layout({ title, paragraphs: lines.map(escapeHtml), button });
  const text = [title, "", ...lines, button ? `\n${button.label} : ${button.url}` : ""].join("\n");
  return { subject, html, text };
}

// F2.1 : confirmation de l'adresse email du chef d'équipe
export function verifyEmailMail(user, link) {
  const fr = {
    subject: "Confirmez votre adresse email",
    title: `Bonjour ${user.prenom},`,
    lines: [
      "Merci pour votre inscription à la Compétition IA & Génie Civil.",
      "Cliquez sur le bouton ci-dessous pour confirmer votre adresse email. Ce lien est valable 24 heures.",
    ],
    button: { label: "Confirmer mon email", url: link },
  };
  const en = {
    subject: "Confirm your email address",
    title: `Hello ${user.prenom},`,
    lines: [
      "Thank you for registering for the AI & Civil Engineering Competition.",
      "Click the button below to confirm your email address. This link is valid for 24 hours.",
    ],
    button: { label: "Confirm my email", url: link },
  };
  return build(user.locale, user.locale === "en" ? en : fr);
}

// F2.3 : invitation d'un membre ajouté par le chef
export function invitationMail({ member, teamName, chefName, link, locale, needsActivation }) {
  const fr = {
    subject: `Vous avez été ajouté à l'équipe ${teamName}`,
    title: `Bonjour ${member.prenom},`,
    lines: [
      `${chefName} vous a ajouté à l'équipe « ${teamName} » pour la Compétition IA & Génie Civil.`,
      needsActivation
        ? "Choisissez votre mot de passe pour activer votre compte et suivre le dossier de votre équipe. Ce lien est valable 7 jours."
        : "Connectez-vous pour suivre le dossier de votre équipe.",
    ],
    button: { label: needsActivation ? "Activer mon compte" : "Me connecter", url: link },
  };
  const en = {
    subject: `You have been added to team ${teamName}`,
    title: `Hello ${member.prenom},`,
    lines: [
      `${chefName} added you to the team "${teamName}" for the AI & Civil Engineering Competition.`,
      needsActivation
        ? "Choose your password to activate your account and follow your team's application. This link is valid for 7 days."
        : "Sign in to follow your team's application.",
    ],
    button: { label: needsActivation ? "Activate my account" : "Sign in", url: link },
  };
  return build(locale, locale === "en" ? en : fr);
}

// F2.7 : notification de changement de statut
export function statusMail({ teamName, status, reason, locale, link }) {
  const label = (STATUS_LABELS[locale] || STATUS_LABELS.fr)[status];
  const fr = {
    subject: `Dossier « ${teamName} » : ${label}`,
    title: `Le statut de votre dossier a changé`,
    lines: [
      `Le dossier de l'équipe « ${teamName} » est maintenant : ${label}.`,
      ...(reason ? [`Motif : ${reason}`] : []),
      status === "en_revision"
        ? "Corrigez les éléments indiqués, puis soumettez à nouveau votre dossier."
        : "Consultez votre tableau de bord pour plus de détails.",
    ],
    button: { label: "Voir mon dossier", url: link },
  };
  const en = {
    subject: `Application "${teamName}": ${label}`,
    title: "Your application status has changed",
    lines: [
      `The application of team "${teamName}" is now: ${label}.`,
      ...(reason ? [`Reason: ${reason}`] : []),
      status === "en_revision"
        ? "Please fix the points mentioned, then submit your application again."
        : "Check your dashboard for more details.",
    ],
    button: { label: "View my application", url: link },
  };
  return build(locale, locale === "en" ? en : fr);
}

export { STATUS_LABELS };

// F1.4 : nouvelle annonce publiée
export function newsMail({ news, locale, link }) {
  const title = (locale === "en" && news.title.en) || news.title.fr;
  const content = (locale === "en" && news.content.en) || news.content.fr;
  // Aperçu : les 400 premiers caractères de l'annonce
  const preview = content.length > 400 ? `${content.slice(0, 400)}…` : content;

  const fr = {
    subject: `Nouvelle annonce : ${title}`,
    title,
    lines: [...preview.split(/\n+/)],
    button: { label: "Lire l'annonce", url: link },
  };
  const en = {
    subject: `New announcement: ${title}`,
    title,
    lines: [...preview.split(/\n+/)],
    button: { label: "Read the announcement", url: link },
  };
  return build(locale, locale === "en" ? en : fr);
}

// F3.4 : message reçu via le formulaire de contact (envoyé à l'organisation, en français)
export function contactMail(msg) {
  return build("fr", {
    subject: `[Contact] ${msg.subject}`,
    title: "Nouveau message depuis le site",
    lines: [
      `De : ${msg.name} <${msg.email}>`,
      `Sujet : ${msg.subject}`,
      ...msg.message.split(/\n+/),
    ],
    button: { label: "Voir dans l'espace admin", url: `${process.env.FRONTEND_URL}/admin/messages` },
  });
}


// F2.X : récupération du mot de passe
export function forgotPasswordMail(user, code) {
  const fr = {
    subject: "Code de récupération de votre mot de passe",
    title: `Bonjour ${user.prenom},`,
    lines: [
      "Vous avez demandé la réinitialisation de votre mot de passe pour la Compétition IA & Génie Civil.",
      `Votre code de récupération est : ${code}`,
      "Ce code est valable pendant 15 minutes.",
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.",
    ],
    button: null,
  };

  const en = {
    subject: "Your password recovery code",
    title: `Hello ${user.prenom},`,
    lines: [
      "You requested a password reset for the AI & Civil Engineering Competition.",
      `Your recovery code is: ${code}`,
      "This code is valid for 15 minutes.",
      "If you did not request this, you can safely ignore this email.",
    ],
    button: null,
  };

  return build(
    user.locale,
    user.locale === "en" ? en : fr
  );
}
// Invitation d'un membre du jury ajouté par l'administrateur
export function juryInvitationMail({ name, link, locale }) {
  const fr = {
    subject: "Invitation : membre du jury — Compétition IA & Génie Civil",
    title: `Bonjour ${name},`,
    lines: [
      "Vous avez été ajouté(e) au jury de la Compétition IA & Génie Civil — ISET Sfax 2026.",
      "Choisissez votre mot de passe pour activer votre compte jury. Ce lien est valable 7 jours.",
    ],
    button: { label: "Activer mon compte", url: link },
  };
  const en = {
    subject: "Invitation: jury member — AI & Civil Engineering Competition",
    title: `Hello ${name},`,
    lines: [
      "You have been added to the jury of the AI & Civil Engineering Competition — ISET Sfax 2026.",
      "Choose your password to activate your jury account. This link is valid for 7 days.",
    ],
    button: { label: "Activate my account", url: link },
  };
  return build(locale, locale === "en" ? en : fr);
}