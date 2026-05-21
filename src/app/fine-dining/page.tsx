"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/Footer"
import { getLocalStorageImages } from "@/lib/local-images"

type ImageContext = "dining" | "menu"

const heroImage = getLocalStorageImages("dining-hero", { sort: "updatedDesc" })[0] || null
const diningImages = getLocalStorageImages("dining", { sort: "createdDesc" })
const menuImages = getLocalStorageImages("dining-menu", { sort: "createdAsc" })

export default function FineDiningPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentMenuIndex, setCurrentMenuIndex] = useState(0)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedImageContext, setSelectedImageContext] = useState<ImageContext>("dining")

  useEffect(() => {
    document.body.style.overflow = selectedImage ? "hidden" : "auto"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [selectedImage])

  const openModal = (imageUrl: string, context: ImageContext, index: number) => {
    setSelectedImage(imageUrl)
    setSelectedImageContext(context)
    setSelectedImageIndex(index)
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

  const nextMenuImage = () => {
    if (menuImages.length === 0) return
    setCurrentMenuIndex((index) => (index === menuImages.length - 1 ? 0 : index + 1))
  }

  const prevMenuImage = () => {
    if (menuImages.length === 0) return
    setCurrentMenuIndex((index) => (index === 0 ? menuImages.length - 1 : index - 1))
  }

  const getModalImages = () => (selectedImageContext === "menu" ? menuImages : diningImages)

  const nextModalImage = () => {
    const images = getModalImages()
    if (images.length === 0) return
    const nextIndex = (selectedImageIndex + 1) % images.length
    setSelectedImageIndex(nextIndex)
    setSelectedImage(images[nextIndex])
  }

  const prevModalImage = () => {
    const images = getModalImages()
    if (images.length === 0) return
    const prevIndex = (selectedImageIndex - 1 + images.length) % images.length
    setSelectedImageIndex(prevIndex)
    setSelectedImage(images[prevIndex])
  }

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
              <a href="/fine-dining" className="text-sm text-orange-400">RESTAURANT</a>
              <a href="/wines" className="text-sm hover:text-orange-400 transition-colors">WINE</a>
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
                    href === "/fine-dining" ? "text-orange-400" : "hover:text-orange-400"
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
              alt="Restaurant - Traditional Georgian Cuisine at Hotel Serodani"
              fill
              className="object-cover object-center"
              priority
              sizes="100vw"
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

      {diningImages.length > 0 && (
        <section className="py-8">
          <div className="w-full overflow-x-auto px-4">
            <div className="flex gap-2 min-w-max">
              {diningImages.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  className="relative h-[280px] w-[350px] flex-shrink-0 overflow-hidden"
                  onClick={() => openModal(src, "dining", index)}
                  aria-label={`Open restaurant image ${index + 1}`}
                >
                  <Image
                    src={src}
                    alt="Georgian cuisine in Kakheti at Hotel Serodani Restaurant"
                    fill
                    sizes="350px"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    loading={index < 3 ? "eager" : "lazy"}
                    unoptimized
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-8">RESTAURANT</h1>
            <p className="text-gray-700 leading-relaxed">
              At Hotel Serodani, our restaurant is much more than a place to eat. It is where the rich flavors and
              traditions of Georgian cuisine come alive.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Guided by a local chef, every dish is prepared with fresh, locally sourced ingredients for an authentic
              taste of Kakheti. The restaurant has two floors, space for up to 100 guests, and terraces with panoramic
              views of Alazani Valley and the Caucasus Mountains.
            </p>
          </div>
        </div>
      </section>

      {menuImages.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Check our Menu</h2>

            <div className="relative max-w-5xl mx-auto">
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentMenuIndex * 100}%)` }}
                >
                  {menuImages.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      className="flex-none w-full flex justify-center items-center"
                      onClick={() => openModal(image, "menu", index)}
                      aria-label={`Open menu image ${index + 1}`}
                    >
                      <div className="relative h-[75vh] w-full max-w-4xl">
                        <Image
                          src={image}
                          alt="Traditional Georgian food menu at Hotel Serodani in Kakheti"
                          fill
                          className="object-contain"
                          loading="lazy"
                          sizes="(max-width: 768px) 90vw, 80vw"
                          unoptimized
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {menuImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevMenuImage}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-10"
                    aria-label="Previous menu image"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                  <button
                    type="button"
                    onClick={nextMenuImage}
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-10"
                    aria-label="Next menu image"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                </>
              )}

              {menuImages.length > 1 && (
                <div className="flex justify-center space-x-2 mt-4">
                  {menuImages.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentMenuIndex(index)}
                      className={`h-3 w-3 rounded-full ${
                        index === currentMenuIndex ? "bg-orange-500" : "bg-gray-300"
                      }`}
                      aria-label={`Go to menu image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div className="relative w-[90vw] h-[90vh] max-w-7xl" onClick={(event) => event.stopPropagation()}>
            <Image
              src={selectedImage}
              alt="Full view"
              fill
              className="object-contain select-none"
              sizes="90vw"
              priority
              quality={90}
              unoptimized
            />

            {getModalImages().length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevModalImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  type="button"
                  onClick={nextModalImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full z-20"
              aria-label="Close modal"
            >
              <X className="h-8 w-8" />
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
