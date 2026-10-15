import { getToken, logout } from "./auth";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Codes renvoyés par le backend quand le token n'est plus valable
const AUTH_ERRORS = [
  "SESSION_EXPIRED",
  "INVALID_TOKEN",
  "UNAUTHORIZED",
  "UNAUTHENTICATED",
];

function apiError(code, data = {}) {
  const err = new Error(code);
  err.code = code;
  err.data = data;
  return err;
}

// Supprime le token et renvoie vers la page de connexion.
function handleExpiredSession() {
  logout();

  if (typeof window === "undefined") return;

  // Évite une boucle de redirection si on est déjà sur /login
  if (!window.location.pathname.startsWith("/login")) {
    const next = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    window.location.href = `/login?expired=1&next=${next}`;
  }
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

    const code =
      data.code ||
      (res.status === 401 ? "SESSION_EXPIRED" : "SERVER_ERROR");

    // 401 sur un appel authentifié = token expiré ou invalide.
    // Sans token (ex. mauvais mot de passe au login), on laisse
    // simplement remonter l'erreur au composant.
    if (token && (res.status === 401 || AUTH_ERRORS.includes(code))) {
      handleExpiredSession();
    }

    throw apiError(code, data);
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

// Indique si une erreur vient d'une session expirée
// (utile dans les catch des composants pour ne pas la logger).
export const isAuthError = (err) => AUTH_ERRORS.includes(err?.code);

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