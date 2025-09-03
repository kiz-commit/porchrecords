import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'square-catalog-production.s3.amazonaws.com',
        port: '',
        pathname: '/files/**',
      },
      {
        protocol: 'https',
        hostname: 'items-images-sandbox.s3.us-west-2.amazonaws.com',
        port: '',
        pathname: '/files/**',
      },
      {
        protocol: 'https',
        hostname: 'items-images-production.s3.us-west-2.amazonaws.com',
        port: '',
        pathname: '/files/**',
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    // Optimize chunk loading to prevent ChunkLoadError
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
            // PageBuilder specific chunks
            pageBuilder: {
              test: /[\\/]components[\\/]PageBuilder[\\/]/,
              name: 'page-builder',
              priority: 5,
              chunks: 'all',
              minChunks: 1,
            },
            // Section components chunk
            sections: {
              test: /[\\/]components[\\/]PageBuilder[\\/]sections[\\/]/,
              name: 'page-builder-sections',
              priority: 10,
              chunks: 'all',
              minChunks: 1,
            },
            // Admin components chunk
            admin: {
              test: /[\\/]app[\\/]admin[\\/]/,
              name: 'admin',
              priority: 5,
              chunks: 'all',
              minChunks: 1,
            },
          },
        },
      };
    }

    // Add error handling for chunk loading
    config.output = {
      ...config.output,
      chunkFilename: dev ? '[name].chunk.js' : '[name].[contenthash].chunk.js',
    };

    return config;
  },
  // Add experimental features to improve stability
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'react-icons'],
  },
  // Enable compression
  compress: true,
  // Enable source maps for debugging (disable in production for smaller bundles)
  productionBrowserSourceMaps: false,
  // Set strict security headers for all routes
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://sandbox.web.squarecdn.com https://web.squarecdn.com",
      "style-src 'self' 'unsafe-inline' https://sandbox.web.squarecdn.com https://web.squarecdn.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://square-fonts-production-f.squarecdn.com https://d1g145x70srn7h.cloudfront.net",
      "connect-src 'self' https://connect.squareup.com https://api.squareup.com https://connect.squareupsandbox.com https://pci-connect.squareup.com https://pci-connect.squareupsandbox.com https://o160250.ingest.sentry.io",
      "frame-src https://sandbox.web.squarecdn.com https://web.squarecdn.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default nextConfig;
