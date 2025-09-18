import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tzlznidvpjoxnczbkeas.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
