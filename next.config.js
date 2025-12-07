const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Increased for larger documents
    },
  },
  webpack: (config, { isServer }) => {
    // Exclude native modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };

      // Exclude server-only packages from client bundle (if needed in future)
      config.externals = config.externals || [];
    } else {
      // On server side, mark native modules as externals to avoid bundling issues (if needed in future)
      config.externals = config.externals || [];
    }

    // Ignore binary files and native modules
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource(resource, context) {
          // Ignore .node files (native modules)
          if (resource && typeof resource === 'string' && resource.endsWith('.node')) {
            return true;
          }
          // Ignore unpkg URLs
          if (resource && typeof resource === 'string' && resource.includes('unpkg.com')) {
            return true;
          }
          return false;
        },
      })
    );
    
    return config;
  },
}

module.exports = nextConfig

