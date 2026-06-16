import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  ...(process.env.NEXT_STATIC === "1"
    ? { output: "export", trailingSlash: true }
    : {}),
};

export default nextConfig;
