import { getToken } from "./auth";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

function apiError(code, data = {}) {
  const err = new Error(code);
  err.code = code;
  err.data = data; // ex. { params: { max: 5 } } ou { checklist: [...] }
  return err;
}

// Appel à l'API. Le jeton est ajouté automatiquement s'il existe.
// body peut être un objet (envoyé en JSON) ou un FormData (envoi de fichier).
export async function api(path, { method = "GET", body, raw = false } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  // Pour un FormData, le navigateur ajoute lui-même le bon Content-Type
  if (body && !isForm) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw apiError("NETWORK");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw apiError(data.code || "SERVER_ERROR", data);
  }
  return raw ? res : res.json();
}

// Ouvre un fichier protégé (pièce justificative) dans un nouvel onglet.
// On ne peut pas utiliser un simple lien, car il faut envoyer le jeton.
export async function openProtectedFile(path) {
  // L'onglet est ouvert tout de suite, sinon le navigateur bloque la fenêtre
  const win = window.open("", "_blank");
  try {
    const res = await api(path, { raw: true });
    const url = URL.createObjectURL(await res.blob());
    if (win) win.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    win?.close();
    throw err;
  }
}

// Télécharge un fichier protégé (export CSV / Excel / PDF)
export async function downloadProtectedFile(path, fileName) {
  const res = await api(path, { raw: true });
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// URL complète d'un fichier public (logo)
export const publicFileUrl = (path) => (path ? `${API_URL}${path}` : null);
