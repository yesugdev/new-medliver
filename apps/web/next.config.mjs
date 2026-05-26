/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@his/shared"],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
