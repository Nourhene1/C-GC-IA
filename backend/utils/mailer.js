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

export async function sendMail({ to, subject, html, text }) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || "Compétition IA-GC <no-reply@iagc.tn>",
    to,
    subject,
    html,
    text,
  });

  if (!useSmtp) {
    console.log(`\n📧 [EMAIL DE DEV] À : ${to}\n   Sujet : ${subject}\n${text}\n`);
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
