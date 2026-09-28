import crypto from "node:crypto";

// Jeton aléatoire de 64 caractères, impossible à deviner
export const randomToken = () => crypto.randomBytes(32).toString("hex");

// Empreinte SHA-256 : c'est elle qu'on enregistre en base.
// Si la base fuite, les jetons des liens ne sont pas utilisables.
export const hashToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");
