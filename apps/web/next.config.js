/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@whiteboard/ui",
    "@whiteboard/editor",
    "@whiteboard/types",
  ],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@prisma/adapter-neon", "@neondatabase/serverless"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

module.exports = nextConfig;