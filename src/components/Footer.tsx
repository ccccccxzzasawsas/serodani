import React from 'react'
import { Facebook, Instagram, MapPin, Phone, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="py-8 bg-[#242323] border-t border-gray-700">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Contact Information */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3 text-gray-300 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-orange-400" />
                <span>Shalauri Village, Telavi, Georgia</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-orange-400" />
                <span>+995 599 40 32 03</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-orange-400" />
                <span>info@serodanihotel.ge</span>
              </div>
              <div>
                <a href="https://serodani.ps.me" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
                  serodani.ps.me
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><a href="/" className="hover:text-orange-400 transition-colors">Home</a></li>
              <li><a href="/rooms" className="hover:text-orange-400 transition-colors">Cottages</a></li>
              <li><a href="/gallery" className="hover:text-orange-400 transition-colors">Gallery</a></li>
              <li><a href="/fine-dining" className="hover:text-orange-400 transition-colors">Restaurant</a></li>
              <li><a href="/wines" className="hover:text-orange-400 transition-colors">Wine</a></li>
              <li><a href="/contact" className="hover:text-orange-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a 
                href="https://www.facebook.com/Serodani.ge" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-orange-400 transition-colors"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a 
                href="https://www.instagram.com/hotel_serodani/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-orange-400 transition-colors"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a 
                href="https://www.tripadvisor.com/Hotel_Review-g1596952-d27099122-Reviews-Serodani-Telavi_Kakheti_Region.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-orange-400 transition-colors"
              >
                <div className="w-6 h-6">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M12,2c5.52,0,10,4.48,10,10s-4.48,10-10,10S2,17.52,2,12S6.48,2,12,2z M12,4c-4.42,0-8,3.58-8,8s3.58,8,8,8 s8-3.58,8-8S16.42,4,12,4z M9,9c0.83,0,1.5,0.67,1.5,1.5S9.83,12,9,12s-1.5-0.67-1.5-1.5S8.17,9,9,9z M15,9 c0.83,0,1.5,0.67,1.5,1.5S15.83,12,15,12s-1.5-0.67-1.5-1.5S14.17,9,15,9z M12,6c3.31,0,6,2.69,6,6s-2.69,6-6,6s-6-2.69-6-6 S8.69,6,12,6z M9,10c-0.28,0-0.5,0.22-0.5,0.5S8.72,11,9,11s0.5-0.22,0.5-0.5S9.28,10,9,10z M15,10c-0.28,0-0.5,0.22-0.5,0.5 S14.72,11,15,11s0.5-0.22,0.5-0.5S15.28,10,15,10z M12,14c-1.1,0-2.1-0.45-2.82-1.18L8.6,13.4C9.57,14.37,10.73,15,12,15 s2.43-0.63,3.4-1.6l-0.58-0.58C14.1,13.55,13.1,14,12,14z"/>
                  </svg>
                </div>
              </a>
              <a 
                href="https://maps.app.goo.gl/R8VqUVqmo4JYePJ3A" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-orange-400 transition-colors"
              >
                <MapPin className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="text-center text-gray-400 text-sm border-t border-gray-700 pt-6">
          <p>© 2025 SERODANI Hotel | All Rights Reserved</p>
        </div>
      </div>
    </footer>
  )
} 