import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.js");

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

const nextConfig = {
  async rewrites() {
    return [
      // Les fichiers publics passent par Next : même origine, backend caché
      { source: "/uploads/:path*", destination: `${API}/uploads/:path*` },
    ];
  },
};

export default withNextIntl(nextConfig);