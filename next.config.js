/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/my-blog',
  images: { unoptimized: true },
};

module.exports = nextConfig;
