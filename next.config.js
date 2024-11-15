/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
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

      // Handle node: protocol
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
};

module.exports = nextConfig;