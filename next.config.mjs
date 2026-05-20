/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  transpilePackages: ["@esmagico/pyzo-auth-sdk"],
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
