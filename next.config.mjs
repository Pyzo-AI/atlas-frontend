/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@esmagico/pyzo-auth-sdk"],
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
