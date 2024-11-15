/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    // Handle node: protocol
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:url': 'url',
      'node:buffer': 'buffer',
      'node:util': 'util',
      'node:stream': 'stream-browserify',
      'node:http': 'stream-http',
      'node:https': 'https-browserify',
    };
    return config;
  },
};

module.exports = nextConfig;