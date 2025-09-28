/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'
  },
  images: {
    domains: [
      'localhost',
      'pixelsqueeze.onrender.com',
      '127.0.0.1'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pixelsqueeze.onrender.com',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5002',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '5002',
        pathname: '/uploads/**',
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}/api/:path*`
      }
    ];
  }
};

module.exports = nextConfig; 