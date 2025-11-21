/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      // Cloudinary images
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  webpack: (config, { isServer }) => {
    // Mark canvas and chartjs-node-canvas as external for server-side rendering
    // These are native modules that cannot be bundled by webpack
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'commonjs canvas',
        'chartjs-node-canvas': 'commonjs chartjs-node-canvas',
      });
    }
    return config;
  },
};

module.exports = nextConfig;


