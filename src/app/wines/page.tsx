"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/Footer"
import { getLocalStorageImages } from "@/lib/local-images"

const wineImages = getLocalStorageImages("wines", { sort: "createdAsc" })
const heroImage = getLocalStorageImages("wines/hero", { sort: "updatedDesc" })[0] || wineImages[0] || null

export default function WinesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm text-white">
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
              <a href="/wines" className="text-sm text-orange-400">WINE</a>
              <a href="/contact" className="text-sm hover:text-orange-400 transition-colors">CONTACT</a>
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
                    href === "/wines" ? "text-orange-400" : "hover:text-orange-400"
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

      <section className="relative w-full aspect-[3/4] md:aspect-video">
        {heroImage ? (
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt="Wine hotel Georgia - Traditional Georgian wine cellar in Kakheti"
              fill
              className="object-cover object-center"
              priority
              sizes="100vw"
              quality={85}
              unoptimized
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
            <p>Hero image not available</p>
          </div>
        )}
      </section>

      <section className="py-16 bg-white">
        <div className="text-center mb-12 px-4">
          <h1 className="text-4xl md:text-5xl font-light italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Our Wine - Tradition and Taste from the Heart of Kakheti
          </h1>
        </div>

        <div className="container mx-auto px-4">
          {wineImages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">No wine images available at this time.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-8 mb-16">
                <div className="md:w-3/4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {wineImages.slice(0, 3).map((src, index) => (
                      <div key={src} className="relative h-[320px]">
                        <Image
                          src={src}
                          alt="Georgian wine from Kakheti at Hotel Serodani"
                          fill
                          className="object-cover"
                          loading={index === 0 ? "eager" : "lazy"}
                          sizes="(max-width: 768px) 100vw, 33vw"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:w-1/4 flex items-center">
                  <p className="text-gray-700 text-xl">
                    At Hotel Serodani, wine is a living tradition. We take pride in producing homemade wines with respect
                    for centuries-old Georgian winemaking methods.
                  </p>
                </div>
              </div>

              <div className="bg-[#A9B4A3] py-12 px-8 mb-16">
                <div className="container mx-auto text-center">
                  <p className="text-lg mb-4"><strong>Saperavi</strong> - Georgia's iconic deep red wine, known for its rich taste and full body.</p>
                  <p className="text-lg mb-4"><strong>Kisi</strong> - a distinctive and aromatic white wine, rich in character.</p>
                  <p className="text-lg mb-4"><strong>Tvishi</strong> - a delicate white wine with fresh floral notes.</p>
                  <p className="text-lg mb-4"><strong>Kindzmarauli</strong> - a naturally semi-sweet red wine with vibrant fruit flavor.</p>
                  <p className="text-lg mb-4"><strong>Rose</strong> - a fresh, elegant wine perfect for any occasion.</p>
                  <p className="text-lg mb-0"><strong>Each bottle is made following traditional techniques.</strong></p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 flex flex-col justify-center">
                  <div className="space-y-8">
                    <p className="text-gray-700 text-xl">
                      Guests can experience Georgian winemaking with a guided wine tour through our cellar, learning about
                      the ancient qvevri method, local varietals, and the craft behind each bottle.
                    </p>
                    <p className="text-gray-700 text-xl">
                      Bottles are available directly from our cellar, so you can take a piece of Kakheti home with you.
                    </p>
                  </div>
                </div>

                <div className="md:w-2/3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {wineImages.slice(3, 6).map((src) => (
                      <div key={src} className="relative h-[320px]">
                        <Image
                          src={src}
                          alt="Traditional wine tasting in Kakheti at Hotel Serodani"
                          fill
                          className="object-cover"
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, 33vw"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap');
      `}</style>

      <Footer />
    </div>
  )
}
