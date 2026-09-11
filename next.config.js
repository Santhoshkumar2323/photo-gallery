/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-964b06ca1ecd4f849cea58d13e50967f.r2.dev',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
