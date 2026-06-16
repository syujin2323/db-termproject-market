import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // node-oracledb는 네이티브/동적 require를 쓰는 서버 전용 모듈이므로
  // 번들링하지 말고 런타임에 node_modules에서 직접 require 하도록 외부 처리한다.
  serverExternalPackages: ["oracledb"],
};

export default nextConfig;
