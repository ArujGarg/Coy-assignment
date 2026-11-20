import type { NextConfig } from "next";

// The API is a separate Express app (see ./backend). The browser keeps calling /api/*
// on this origin and Next forwards it to Express, so there are no CORS headaches.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

const config: NextConfig = {
  images: { unoptimized: true },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default config;
