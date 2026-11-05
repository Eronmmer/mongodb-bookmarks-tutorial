import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent automatic instruction-file generation.
  agentRules: false,
  // Keep this project as the workspace root when parent directories have lockfiles.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
