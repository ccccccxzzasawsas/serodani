/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    domains: ["firebasestorage.googleapis.com"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 350],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/serodani-b031d.firebasestorage.app/o/**',
      },
    ],
    formats: ['image/webp']
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
    pagesBufferLength: 5,
  },
};

module.exports = nextConfig; 