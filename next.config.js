/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent console.log stripping
  compiler: {
    removeConsole: false,
  },
  env: {
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI,
  },
  poweredByHeader: false,
  reactStrictMode: true,
  // Disable webpack cache to fix "Unable to snapshot resolve dependencies" error
  webpack: (config, { isServer }) => {
    // Disable the webpack cache
    config.cache = false;
    
    if (!isServer) {
      // Fallback for Node.js built-in modules
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
        url: require.resolve('url'),
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

    // Add a custom plugin to handle node: protocol
    config.plugins.push(new (require('webpack')).NormalModuleReplacementPlugin(
      /^node:/,
      (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
      }
    ));

    return config;
  },
};

module.exports = nextConfig;