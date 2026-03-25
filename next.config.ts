import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@node-rs/jieba', 'cc-cedict'],
  allowedDevOrigins: ['parths-macbook-pro'],
}

export default nextConfig
