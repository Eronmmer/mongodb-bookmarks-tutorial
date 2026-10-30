import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Codespaces forwards port 3000 with a localhost Origin header.
  // Keep this allowance limited to its development container.
  ...(process.env.NODE_ENV === "development" &&
  process.env.CODESPACES === "true"
    ? { experimental: { serverActions: { allowedOrigins: ["localhost:3000"] } } }
    : {}),
  // Pin the Turbopack workspace root to this project to avoid incorrect root
  // inference when other lockfiles exist higher up the filesystem.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
