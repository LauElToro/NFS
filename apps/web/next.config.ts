import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nfs/domain", "@nfs/application", "@nfs/infrastructure"],
  serverExternalPackages: ["@prisma/client", "bcryptjs", "qrcode"],
};

export default nextConfig;
