import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用 standalone 输出模式，用于 Docker 部署
  output: 'standalone',
  
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NODE_ENV === 'production' 
          ? "http://monitor-server:9000/api/:path*"  // Docker 容器内部通信
          : "http://localhost:9000/api/:path*",     // 本地开发
      },
    ];
  },
};

export default nextConfig;
