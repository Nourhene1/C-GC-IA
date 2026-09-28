const isBrowser = () => typeof window !== "undefined";

export function saveSession(token, user, remember = true) {
  if (!isBrowser()) return;
  logout(); // on efface une éventuelle ancienne session
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("token", token);
  storage.setItem("user", JSON.stringify(user));
}

export function getToken() {
  if (!isBrowser()) return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export function logout() {
  if (!isBrowser()) return;
  ["token", "user"].forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

// Page d'accueil selon le rôle, après connexion
export function homeFor(user) {
  if (user.role === "admin") return "/admin";
  if (user.role === "chef" && !user.team) return "/team/new";
  return "/dashboard";
}
