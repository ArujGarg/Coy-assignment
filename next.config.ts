import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
  images: { unoptimized: true },
};

export default config;
