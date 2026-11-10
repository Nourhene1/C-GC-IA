const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const ADMIN_BASE = `${API}/api/admin/event-sponsors`;
const PUBLIC_BASE = `${API}/api/event-sponsors`;

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handle = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.code || "SERVER_ERROR");
    err.code = data.code;
    throw err;
  }
  return data;
};

// Transforme /uploads/... en URL absolue
export const assetUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;

  const clean = String(path)
    .replace(/\\/g, "/")        // chemins Windows
    .replace(/^\/+/, "")        // slash initial
    .replace(/^uploads\//, "")  // "uploads/..."
    .replace(/^public\//, "");  // "public/..."

  return `/uploads/${clean}`;
};

export const eventSponsorsApi = {
  list(params = {}) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== "" && v != null)
    ).toString();
    return fetch(`${ADMIN_BASE}${qs ? `?${qs}` : ""}`, { headers: authHeaders() }).then(handle);
  },

  create(formData) {
    return fetch(ADMIN_BASE, { method: "POST", headers: authHeaders(), body: formData }).then(handle);
  },

  update(id, formData) {
    return fetch(`${ADMIN_BASE}/${id}`, { method: "PUT", headers: authHeaders(), body: formData }).then(handle);
  },

  toggleActive(id, active) {
    return fetch(`${ADMIN_BASE}/${id}/active`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    }).then(handle);
  },

  reorder(items) {
    return fetch(`${ADMIN_BASE}/reorder`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    }).then(handle);
  },

  remove(id) {
    return fetch(`${ADMIN_BASE}/${id}`, { method: "DELETE", headers: authHeaders() }).then(handle);
  },
};

// Public : aucun token, toujours les données à jour
export const fetchPublicEventSponsors = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${PUBLIC_BASE}${qs ? `?${qs}` : ""}`, { cache: "no-store" }).then(handle);
};

export const TIERS = [
  { value: "titre" },
  { value: "diamond" },
  { value: "platine" },
  { value: "or" },
  { value: "argent" },
  { value: "bronze" },
];

// Charge les éditions et renvoie toujours un tableau
export async function fetchEditions() {
  try {
    const res = await fetch(`${API}/api/editions`);
    if (!res.ok) return [];

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.editions)) return data.editions;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch {
    return [];
  }
}