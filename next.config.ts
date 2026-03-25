import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@node-rs/jieba', 'cc-cedict', 'better-sqlite3'],
  allowedDevOrigins: ['parths-macbook-pro'],
  output: 'standalone',
}

export default nextConfig
