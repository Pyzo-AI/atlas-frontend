/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  transpilePackages: ["@esmagico/pyzo-auth-sdk"],
  experimental: {
    instrumentationHook: true,
    externalDir: true,
  },
  webpack: (config) => {
    // Point directly to the pre-built dist so webpack doesn't try to
    // traverse the symlink into the SDK source (which causes module-not-found errors).
    config.resolve.alias["@esmagico/pyzo-auth-sdk"] = path.resolve(
      __dirname,
      "../pyzo-auth-sdk/dist/index.js"
    );
    return config;
  },
};

export default nextConfig;
