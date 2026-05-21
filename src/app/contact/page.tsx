"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, MapPin, Menu, Phone, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/Footer"

export default function ContactPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#242323] text-white">
      <nav className="fixed top-0 w-full z-50 bg-[#242323]/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              className="lg:hidden focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-orange-400" />
              ) : (
                <Menu className="h-6 w-6 text-orange-400" />
              )}
            </button>

            <div className="hidden lg:flex lg:space-x-8">
              <a href="/" className="text-sm hover:text-orange-400 transition-colors">HOME</a>
              <a href="/rooms" className="text-sm hover:text-orange-400 transition-colors">COTTAGES</a>
              <a href="/gallery" className="text-sm hover:text-orange-400 transition-colors">GALLERY</a>
              <a href="/fine-dining" className="text-sm hover:text-orange-400 transition-colors">RESTAURANT</a>
              <a href="/wines" className="text-sm hover:text-orange-400 transition-colors">WINE</a>
              <a href="/contact" className="text-sm text-orange-400">CONTACT</a>
            </div>

            <Button
              variant="outline"
              className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black"
              asChild
            >
              <Link href="/booking?checkInDate=28.07.2025&checkOutDate=29.07.2025">Book Now</Link>
            </Button>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden pt-4 pb-2 space-y-2 border-t border-gray-700 mt-4">
              {[
                ["HOME", "/"],
                ["COTTAGES", "/rooms"],
                ["GALLERY", "/gallery"],
                ["RESTAURANT", "/fine-dining"],
                ["WINE", "/wines"],
                ["CONTACT", "/contact"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className={`block py-2 text-sm transition-colors ${
                    href === "/contact" ? "text-orange-400" : "hover:text-orange-400"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
              <div className="py-2" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black"
                  asChild
                >
                  <Link href="/booking?checkInDate=28.07.2025&checkOutDate=29.07.2025">Book Now</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="pt-20">
        <section className="py-20 bg-[#242323]">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold text-center mb-16">CONTACT US</h1>
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-xl font-semibold mb-6">Address</h2>
                <div className="space-y-4 text-gray-300">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-orange-400" />
                    <span>Shalauri Village, Telavi, Georgia</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-orange-400" />
                    <span>+995 599 40 32 03</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-orange-400" />
                    <span>info@serodanihotel.ge</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a
                      href="https://www.google.com/maps/place/%E1%83%A1%E1%83%94%E1%83%A0%E1%83%9D%E1%83%93%E1%83%90%E1%83%9C%E1%83%98/@41.9062177,45.4928842,17z/data=!4m9!3m8!1s0x404433f8b9e2e367:0x7dd2cf495cd7b4f!5m2!4m1!1i2!8m2!3d41.9062137!4d45.4954591!16s%2Fg%2F11v4514mjr?entry=ttu&g_ep=EgoyMDI1MDYxMS4wIKXMDSoASAFQAw%3D%3D"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:underline"
                    >
                      View on Google Maps
                    </a>
                  </div>
                  <div className="flex items-center space-x-3">
                    <a
                      href="https://serodani.ps.me"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:underline"
                    >
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
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2975.1598831148797!2d45.49283377649865!3d41.90621772158098!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x404433f8b9e2e367%3A0x7dd2cf495cd7b4f!2z4YOh4YOQ4YOg4YOd4YOT4YOQ4YOc4YOY!5e0!3m2!1ska!2sge!4v1720730462774!5m2!1ska!2sge"
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

      <Footer />
    </div>
  )
}
