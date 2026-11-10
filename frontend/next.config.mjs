import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.js");

// Adresse interne du backend : reste côté serveur, jamais envoyée au navigateur
const API_URL = process.env.API_URL || "http://localhost:5000";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/files/:path*",
        destination: `${API_URL}/uploads/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);