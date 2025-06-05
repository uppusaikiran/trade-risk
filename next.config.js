/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['logo.clearbit.com'],
  },
  // Ensure we're not using static export
  trailingSlash: false,
}

module.exports = nextConfig 