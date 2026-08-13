import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Défaut 1 Mo trop juste pour jusqu'à 5 photos compressées côté client envoyées
      // en une seule action (upload réel vers Supabase Storage remplacera ce chemin plus tard).
      bodySizeLimit: "8mb",
    },
  },
};

export default withNextIntl(nextConfig);
