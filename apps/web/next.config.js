/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@whiteboard/ui",
    "@whiteboard/editor",
    "@whiteboard/types",
  ],
  experimental: {
    serverComponentsExternalPackages: [
      "@prisma/client",
      "@prisma/engines",
      "prisma",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("@prisma/client", "@prisma/engines", "prisma");
    }
    // pdfjs-dist uses optional 'canvas' module (Node-only) — provide empty fallback for client
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

module.exports = nextConfig;