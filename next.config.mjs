/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlify deployment configuration
  trailingSlash: true,
  
  // Optimize images and assets
  images: {
    unoptimized: true, // Required for static export
  },
  
  // Reduce bundle size (swcMinify is deprecated, SWC is default now)
  
  // Enable React strict mode for production
  reactStrictMode: true,
  
  // Redirects are handled by netlify.toml for static export
  
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