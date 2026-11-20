import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The application is request-dependent (database, cookies, PDF responses),
  // so the classic dynamic rendering model is used instead of Cache Components.
  cacheComponents: false,
  partialPrefetching: false,
  // Produce a self-contained server bundle for the Docker image.
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
