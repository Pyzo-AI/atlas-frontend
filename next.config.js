/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // 👈 Required for static export (to use drag & drop on Netlify)
  output: 'standalone', // 👈 Required for Docker standalone build

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  webpack: (config, { isServer }) => {
    // Fix for PostHog Node.js module imports
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        child_process: false,
      }

      // Handle node: prefixed modules
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:fs': false,
        'node:path': false,
        'node:child_process': false,
      }

      // Add a plugin to handle node: prefixed imports
      const webpack = require('webpack')
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource) => {
            resource.request = resource.request.replace(/^node:/, '')
          }
        )
      )
    }

    return config
  },
}

module.exports = nextConfig
