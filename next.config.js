/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Disable problematic Node.js modules in the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };

      // Handle node: protocol
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:url': require.resolve('url/'),
        'node:buffer': require.resolve('buffer/'),
        'node:util': require.resolve('util/'),
        'node:stream': require.resolve('stream-browserify'),
        'node:http': require.resolve('stream-http'),
        'node:https': require.resolve('https-browserify'),
      };
    }

    return config;
  },
};

module.exports = nextConfig;