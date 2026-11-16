import type { NextConfig } from "next";

const REPO_NAME = "drawrule-site";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "export",
  basePath: `/${REPO_NAME}`,
  assetPrefix: `/${REPO_NAME}`,
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
