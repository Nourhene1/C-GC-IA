import nodemailer from "nodemailer";

const useSmtp = Boolean(process.env.SMTP_HOST);

// Sans SMTP (développement), nodemailer "simule" l'envoi et on affiche l'email
// dans le terminal : tu peux copier les liens de confirmation directement.
const transporter = useSmtp
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : nodemailer.createTransport({ jsonTransport: true });

// attachments (facultatif) : [{ filename, content (Buffer), contentType }] — ex. attestation PDF (F7.6)
export async function sendMail({ to, subject, html, text, attachments }) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || "Compétition IA-GC <no-reply@iagc.tn>",
    to,
    subject,
    html,
    text,
    attachments,
  });

  if (!useSmtp) {
    const files = attachments?.length ? `\n   Pièces jointes : ${attachments.map((a) => a.filename).join(", ")}` : "";
    console.log(`\n📧 [EMAIL DE DEV] À : ${to}\n   Sujet : ${subject}${files}\n${text}\n`);
  }
}

// Version qui ne fait jamais échouer la requête : un email perdu ne doit pas
// empêcher l'inscription ou la validation d'un dossier. L'erreur est journalisée.
export async function sendMailSafe(mail) {
  try {
    await sendMail(mail);
  } catch (err) {
    console.error(`Échec d'envoi de l'email à ${mail.to} :`, err.message);
  }
}
