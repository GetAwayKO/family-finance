import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Самодостаточная сборка в .next/standalone для Docker-образа.
  output: "standalone",
};

export default nextConfig;
