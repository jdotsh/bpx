const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },
  webpack: (config, { isServer, dev }) => {
    // Handle BPMN.js dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Optimize bundle splitting for production builds
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Separate BPMN.js into its own chunk for better caching
            bpmn: {
              test: /[\\/]node_modules[\\/](bpmn-js|diagram-js|dmn-js|cmmn-js)/,
              name: 'bpmn',
              priority: 30,
              enforce: true,
            },
            // Separate React ecosystem
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-router)/,
              name: 'react-vendor',
              priority: 20,
              enforce: true,
            },
            // UI library chunk
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|class-variance-authority)/,
              name: 'ui-vendor',
              priority: 15,
              enforce: true,
            },
            // Common vendor chunk
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 10,
              enforce: true,
            }
          }
        }
      };
    }
    
    return config;
  },
  // Production optimizations
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

module.exports = withBundleAnalyzer(nextConfig);