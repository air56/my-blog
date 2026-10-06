const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/my-blog',
  images: { unoptimized: true },
};

// Next 14's dev export check compares encoded Chinese routes to decoded params.
// Static export is only needed for the production GitHub Pages build.
module.exports = (phase) => ({
  ...nextConfig,
  ...(phase === PHASE_DEVELOPMENT_SERVER ? {} : { output: 'export' }),
});
