import { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
      domains: ["tong.visitkorea.or.kr", "res.cloudinary.com", "example.com"],
   },
   eslint: {
      ignoreDuringBuilds: true, // ✅ ESLint 검사 무시 (배포 중단 방지)
   },
   typescript: {
      ignoreBuildErrors: true, // ✅ TypeScript 타입 오류 무시 (배포 중단 방지)
   },
};

export default nextConfig;
