/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  webpack: (config) => {
    // Suppress canvas warning for react-pdf in server bundles
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
