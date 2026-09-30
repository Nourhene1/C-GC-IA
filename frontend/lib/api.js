import { getToken } from "./auth";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

function apiError(code, data = {}) {
  const err = new Error(code);
  err.code = code;
  err.data = data;
  return err;
}

// Appel à l'API.
// Le token est ajouté automatiquement s'il existe.
// body peut être un objet JSON ou un FormData.
export async function api(
  path,
  { method = "GET", body, raw = false } = {}
) {
  const isForm =
    typeof FormData !== "undefined" && body instanceof FormData;

  const headers = {};

  let token = null;

  try {
    token = getToken();
  } catch (err) {
    console.error("Erreur lors de la récupération du token :", err);
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body && !isForm) {
    headers["Content-Type"] = "application/json";
  }

  let res;

  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body
        ? isForm
          ? body
          : JSON.stringify(body)
        : undefined,
    });
  } catch (err) {
    console.error("Erreur réseau :", err);
    throw apiError("NETWORK");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));

    throw apiError(data.code || "SERVER_ERROR", data);
  }

  if (raw) {
    return res;
  }

  // Évite une erreur si l'API retourne une réponse vide
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  return null;
}

// Ouvre un fichier protégé dans un nouvel onglet.
export async function openProtectedFile(path) {
  const win = window.open("", "_blank");

  try {
    const res = await api(path, { raw: true });

    const url = URL.createObjectURL(await res.blob());

    if (win) {
      win.location.href = url;
    } else {
      window.location.href = url;
    }

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60_000);
  } catch (err) {
    win?.close();
    throw err;
  }
}

// Télécharge un fichier protégé.
export async function downloadProtectedFile(path, fileName) {
  const res = await api(path, { raw: true });

  const url = URL.createObjectURL(await res.blob());

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1_000);
}

// URL complète d'un fichier public.
export const publicFileUrl = (path) =>
  path ? `${API_URL}${path}` : null;
