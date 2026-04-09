/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@whiteboard/ui",
    "@whiteboard/editor",
    "@whiteboard/types",
    "@whiteboard/db",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

module.exports = nextConfig;
