// Image optimization configuration for Next.js
// This module configures the Next.js Image component to optimize image loading

// Configuration for cache duration and image optimization
export const imageConfig = {
  // Default image domains that need optimization
  domains: [],
  
  // Set caching behavior - გავზარდოთ ქეშირების დრო
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 დღე
  
  // Define image device sizes for responsive images - შევამციროთ ზომების რაოდენობა
  deviceSizes: [640, 1080, 1920],
  
  // Define image sizes for srcSet - შევამციროთ ზომების რაოდენობა
  imageSizes: [32, 96, 256],
  
  // Set default image formats - მხოლოდ webp ფორმატი
  formats: ['image/webp'],
  
  // Enable dangerouslyAllowSVG for placeholder SVGs
  dangerouslyAllowSVG: true,
  
  // Set content security policy
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  
  // Whether to prefer animated images or static ones
  animatedGifs: false, // გავთიშოთ ანიმირებული GIF-ები
  
  // How many concurrent requests to use when fetching images - შევამციროთ კონკურენტული რექვესტების რაოდენობა
  maxConcurrentRequests: 3,
  
  // გავთიშოთ ოპტიმიზაცია სტატიკური სურათებისთვის
  unoptimized: true,
};

// Helper function to preconnect to image domains
export const setupImagePreconnect = () => {
  if (typeof document !== 'undefined') {
    const head = document.head;
    
    // Images are served from the local public directory.
  }
};

// Export default configuration
export default imageConfig; 
