/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 動的パラメータを使用するページを静的生成から除外
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig
