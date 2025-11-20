import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure build tooling treats this project root as the tracing root
  // when multiple lockfiles exist on the machine.
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "akbhaktvwspzyhdlgoez.supabase.co",
      },
    ],
  },
};

export default nextConfig;
