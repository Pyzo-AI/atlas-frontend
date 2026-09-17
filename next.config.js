/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // 👈 Required for static export (to use drag & drop on Netlify)
  output: 'standalone', // 👈 Required for Docker standalone build

  images: {
    // Some cross-product icons (e.g. the sidebar tool switcher's product
    // icons from central-services) are SVGs served through a signed
    // media-proxy URL with no .svg extension, so Next can't skip
    // optimization for them the way it does for local *.svg imports — they
    // route through /_next/image, which blocks SVG content by default (it
    // can carry scripts). Safe here: sources are our own/sibling PYZO
    // backends, not arbitrary third-party content, and the CSP below
    // sandboxes the served SVG regardless, per Next's own recommendation.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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