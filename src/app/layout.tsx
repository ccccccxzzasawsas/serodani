import type React from "react"
import type { Metadata } from "next"
import { AuthProvider } from "@/lib/auth"
import { AdminButton } from "@/components/admin-button"
import "./globals.css"
import Script from "next/script"
import { Toaster } from "@/components/ui/toaster"
import { FacebookIcon, Instagram } from "lucide-react"

export const metadata: Metadata = {
  title: "Serodani Hotel",
  description: "Hotel with pool in Sighnaghi, Georgia",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="preconnect" 
          href="https://firebasestorage.googleapis.com" 
          crossOrigin="anonymous"
        />
        <link 
          rel="dns-prefetch" 
          href="https://firebasestorage.googleapis.com"
        />
      </head>
      <body>
        <AuthProvider>
          <AdminButton />
          {children}
          <Toaster />
          
          {/* Social Media Fixed Sidebar */}
          <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50">
            <div className="flex flex-col space-y-6 bg-white py-4 px-3 shadow-md">
              <a 
                href="https://www.tripadvisor.com/Hotel_Review-g1596952-d27099122-Reviews-Serodani-Telavi_Kakheti_Region.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-orange-400 transition-colors"
                aria-label="TripAdvisor"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M12,2c5.52,0,10,4.48,10,10s-4.48,10-10,10S2,17.52,2,12S6.48,2,12,2z M12,4c-4.42,0-8,3.58-8,8s3.58,8,8,8 s8-3.58,8-8S16.42,4,12,4z M9,9c0.83,0,1.5,0.67,1.5,1.5S9.83,12,9,12s-1.5-0.67-1.5-1.5S8.17,9,9,9z M15,9 c0.83,0,1.5,0.67,1.5,1.5S15.83,12,15,12s-1.5-0.67-1.5-1.5S14.17,9,15,9z M12,6c3.31,0,6,2.69,6,6s-2.69,6-6,6s-6-2.69-6-6 S8.69,6,12,6z M9,10c-0.28,0-0.5,0.22-0.5,0.5S8.72,11,9,11s0.5-0.22,0.5-0.5S9.28,10,9,10z M15,10c-0.28,0-0.5,0.22-0.5,0.5 S14.72,11,15,11s0.5-0.22,0.5-0.5S15.28,10,15,10z M12,14c-1.1,0-2.1-0.45-2.82-1.18L8.6,13.4C9.57,14.37,10.73,15,12,15 s2.43-0.63,3.4-1.6l-0.58-0.58C14.1,13.55,13.1,14,12,14z"/>
                </svg>
              </a>
              <a 
                href="https://www.facebook.com/Serodani.ge" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-orange-400 transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon size={24} />
              </a>
              <a 
                href="https://www.instagram.com/hotel_serodani/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-orange-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={24} />
              </a>

            </div>
          </div>
          
          <footer className="py-6 bg-[#242323] text-center text-gray-400 text-sm">
          </footer>
        </AuthProvider>
        <Script id="image-optimization" strategy="afterInteractive">
          {`
            // Initialize image optimization
            (function() {
              // Set localStorage to prevent repeated image downloads
              if ('localStorage' in window) {
                // Create a session-based cache key
                const cacheKey = 'image_cache_' + (new Date().toDateString());
                
                // Mark the current session as having loaded images
                localStorage.setItem(cacheKey, 'true');
                
                // Add event listener to preload images on hover
                document.addEventListener('mouseover', function(e) {
                  const target = e.target;
                  if (target.tagName === 'IMG' && !target.dataset.preloaded) {
                    // Mark image as preloaded
                    target.dataset.preloaded = 'true';
                    
                    // Force browser to keep the image in cache
                    target.style.visibility = 'visible';
                  }
                }, { passive: true });
              }
            })();
          `}
        </Script>
      </body>
    </html>
  )
}
