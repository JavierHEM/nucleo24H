import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/pdf/sello": ["./public/logo/negativo.png"],
  },
};

export default nextConfig;
