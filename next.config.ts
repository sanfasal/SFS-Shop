import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the web and dashboard dev servers run side by side without
  // fighting over the same build folder (see the dev:* scripts).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
