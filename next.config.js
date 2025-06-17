/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    domains: ["firebasestorage.googleapis.com"],
    deviceSizes: [640, 1080],
    imageSizes: [32, 64],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/serodani-b031d.firebasestorage.app/o/**',
      },
    ],
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    disableStaticImages: true,
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
    // სერვერის დაკეშირებული გვერდების შენახვის დრო
    maxInactiveAge: 60 * 60 * 1000, // 1 საათი
    // მაქსიმუმ რამდენი გვერდი შეინახოს ქეშში
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig; 