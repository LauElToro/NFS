import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nfs/domain", "@nfs/application", "@nfs/infrastructure"],
  serverExternalPackages: ["bcryptjs", "qrcode"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  outputFileTracingIncludes: {
    "/**": ["../../data/**/*"],
  },
};

export default nextConfig;
