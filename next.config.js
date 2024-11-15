/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  webpack: (config, { dev, isServer }) => {
    // Configure webpack caching
    config.cache = {
      type: 'filesystem',
      version: `${process.env.NODE_ENV}_${Date.now()}`,
      cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'),
      store: 'pack',
      buildDependencies: {
        config: [__filename],
      },
    };

    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          child_process: false,
          http: false,
          https: false,
          crypto: false,
          stream: false,
          buffer: false,
          url: false,
          util: false,
          assert: false,
        },
      };

      config.resolve.alias = {
        ...config.resolve.alias,
        url: false,
        'node:url': false,
        'node:buffer': false,
        'node:util': false,
        'node:stream': false,
        'node:http': false,
        'node:https': false,
        buffer: false,
        stream: false,
      };
    }

    return config;
  },
  // Disable React Strict Mode as it can cause issues with some dependencies
  reactStrictMode: false,
};

module.exports = nextConfig;