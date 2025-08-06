/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for faster navigation
  experimental: {
    // Enable optimistic navigation
    optimisticClientCache: true,
  },
  
  // Optimize images and assets
  images: {
    unoptimized: true, // For faster dev builds
  },
  
  // Reduce bundle size
  swcMinify: true,
  
  // Enable faster refresh
  reactStrictMode: false, // Disable for faster dev
  
  // Optimize redirects
  async redirects() {
    return [
      {
        source: '/app/creatives-lab',
        destination: '/app/creatives-lab',
        permanent: false,
      },
    ];
  },
  
  // Performance optimizations
  poweredByHeader: false,
  generateEtags: false,
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Optimize for faster dev builds
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;