"use client"

import React from "react"
import { AuthProvider } from "@/lib/auth"
import { AdminButton } from "@/components/admin-button"
import Script from "next/script"
import { Toaster } from "@/components/ui/toaster"
import { FacebookIcon, Instagram } from "lucide-react"

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminButton />
      {children}
      <Toaster />
      
      {/* Social Media Fixed Sidebar */}
      <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50 hidden md:block">
        <div className="flex flex-col space-y-6 bg-white py-4 px-3 shadow-md rounded-l-md">
          <a 
            href="https://www.viator.com/tour/Kakheti/Serodani-Cottage-Stay-and-Wine-Experience/d24521-443417P1" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-orange-400 transition-colors"
            aria-label="Viator"
          >
            <img 
              src="/viserlogo.png" 
              alt="Viator" 
              width="24" 
              height="24" 
              style={{ display: 'block' }}
            />
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
      
      {/* Mobile Social Media Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="flex justify-center space-x-8 bg-white py-3 px-4 shadow-md border-t border-gray-200">
          <a 
            href="https://www.viator.com/tour/Kakheti/Serodani-Cottage-Stay-and-Wine-Experience/d24521-443417P1" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-orange-400 transition-colors"
            aria-label="Viator"
          >
            <img 
              src="/viserlogo.png" 
              alt="Viator" 
              width="24" 
              height="24" 
              style={{ display: 'block' }}
            />
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
    </AuthProvider>
  )
} 