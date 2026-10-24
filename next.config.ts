import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    useTypeScriptCli: false,
  },
  // Listening clips are named after a hash of their content, so a file never
  // changes once published and browsers can keep it.
  async headers() {
    return [
      {
        source: "/audio/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
