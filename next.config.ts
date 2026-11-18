import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "pglite-prisma-adapter"],
  images: { unoptimized: true },
};

export default config;
