"use client"

import { MapPin, Phone, Mail, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import { Footer } from "@/components/Footer"

export default function ContactPage() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div className="min-h-screen bg-[#242323] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#242323]/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              <a href="/" className="text-sm hover:text-orange-400 transition-colors">
                HOME
              </a>
              <a href="/rooms" className="text-sm hover:text-orange-400 transition-colors">
                COTTAGES
              </a>
              <a href="/gallery" className="text-sm hover:text-orange-400 transition-colors">
                GALLERY
              </a>
              <a href="/fine-dining" className="text-sm hover:text-orange-400 transition-colors">
                RESTAURANT
              </a>
              <a href="/wines" className="text-sm hover:text-orange-400 transition-colors">
                WINE
              </a>
              <a href="/#contact" className="text-sm text-orange-400">
                CONTACT
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black"
              >
                Book Now
              </Button>

              {/* Login/User Menu */}
              {user ? (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4" />
                    <span>{user.displayName || user.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-orange-400 hover:text-orange-300"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link href="/admin/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-orange-400 hover:text-orange-300 hover:bg-orange-400/10"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with padding for fixed navbar */}
      <main className="pt-20">
        {/* Contact Section */}
        <section className="py-20 bg-[#242323]">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold text-center mb-16">CONTACT US</h1>
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-xl font-semibold mb-6">Address</h2>
                <div className="space-y-4 text-gray-300">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-orange-400" />
                    <span>Shalauri Village, Telavi, Georgia</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-orange-400" />
                    <span>+995 599 40 32 03</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-orange-400" />
                    <span>info@serodanihotel.ge</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a href="https://maps.app.goo.gl/R8VqUVqmo4JYePJ3A" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline flex items-center">
                      <span>View on Google Maps</span>
                    </a>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a href="https://serodani.ps.me" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
                      serodani.ps.me
                    </a>
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold mb-6 mt-8">Contact</h2>
                <p className="text-gray-300 mb-6">
                  For reservations and inquiries, please contact us directly or use our online booking system.
                </p>
                

              </div>
              <div className="relative h-[550px] rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2976.0362900892893!2d45.444419511397876!3d41.857483605717!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40447f5eba48990f%3A0x2b74c088d3c45d0d!2sSerodani!5e0!3m2!1sen!2sge!4v1718290295321!5m2!1sen!2sge"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
} 