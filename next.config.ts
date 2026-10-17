import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["firebase-admin", "jwks-rsa", "jose"],
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
  allowedDevOrigins: ['187.126.0.174'],
};

export default nextConfig;
