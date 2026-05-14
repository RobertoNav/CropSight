import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",

        destination: `${
          process.env.BACKEND_URL ||
          "http://cropsight-dev-alb-193804761.us-east-1.elb.amazonaws.com"
        }/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
