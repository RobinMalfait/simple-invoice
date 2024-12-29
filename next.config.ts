import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
}

export default nextConfig
