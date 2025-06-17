/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    domains: ["firebasestorage.googleapis.com"],
    deviceSizes: [640, 1080, 1920],
    imageSizes: [32, 96, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/serodani-b031d.firebasestorage.app/o/**',
      },
    ],
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 დღე
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // სურათების ოპტიმიზაცია
  compress: true,
  // Windows-ზე ESM-ის პრობლემას აგვარებს, ვაუქმებთ experimental ფლაგს
  
  // ქეშირების კონფიგურაცია
  staticPageGenerationTimeout: 120, // 2 წუთი
  onDemandEntries: {
    // სერვერის დაკეშირებული გვერდების შენახვის დრო - გავზარდოთ
    maxInactiveAge: 60 * 60 * 24 * 1000, // 24 საათი
    // შევამციროთ დაკეშირებული გვერდების რაოდენობა
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig; 