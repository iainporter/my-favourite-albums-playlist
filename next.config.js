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
        http: false,
        https: false,
        zlib: false,
        path: false,
        stream: false,
        util: false,
        url: false,
        crypto: false,
      };

      // Remove all node: protocol aliases
      const aliases = { ...config.resolve.alias };
      Object.keys(aliases).forEach(key => {
        if (key.startsWith('node:')) {
          delete aliases[key];
        }
      });
      config.resolve.alias = aliases;

      // Add webpack ignores for node: protocol
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        resolve: {
          fullySpecified: false,
        },
      });
    }

    return config;
  },
  // Add transpilePackages to handle any problematic dependencies
  transpilePackages: ['spotify-web-api-node'],
};

module.exports = nextConfig;