"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, ChevronLeft, ChevronRight, User, Menu, X, Settings } from "lucide-react"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import { ref, listAll, getDownloadURL, getMetadata } from "firebase/storage"
import { Footer } from "@/components/Footer"

export default function KviriaHotel() {
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0)
  const [heroImage, setHeroImage] = useState("/home/gallery (15).jpg")
  const [sliderImages, setSliderImages] = useState<string[]>([])
  const [storyImages, setStoryImages] = useState<string[]>([])
  const [largePhoto, setLargePhoto] = useState("")
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [guestReviewImage, setGuestReviewImage] = useState("")
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, signOut, isAdmin } = useAuth()
  const sliderTrackRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    // Clear browser cache for images
    if (typeof window !== 'undefined') {
      const clearImageCache = () => {
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              caches.delete(cacheName)
            })
          })
        }
        localStorage.setItem("cacheCleared", new Date().toISOString())
      }
      clearImageCache()
    }

    const fetchContent = async () => {
      // Set fallback slider images
      setSliderImages([
        '/slider/1.jpg',
        '/slider/2.jpg',
        '/slider/3.jpg',
        '/slider/4.jpg',
        '/slider/5.jpg',
        '/slider/6.jpg',
        '/slider/7.jpg',
      ])

      try {
        // Fetch hero image
        const heroDoc = await getDoc(doc(db, "sections", "hero"))
        if (heroDoc.exists() && heroDoc.data().imageUrl) {
          setHeroImage(heroDoc.data().imageUrl)
        }

        // Fetch slider images
        try {
          const sliderRef = ref(storage, '/slider')
          const sliderResult = await listAll(sliderRef)
          const sliderImageUrls = (await Promise.all(
            sliderResult.items.map(async (imageRef) => {
              try {
                return await getDownloadURL(imageRef)
              } catch (error) {
                return null
              }
            })
          )).filter(url => url !== null) as string[]
          if (sliderImageUrls.length > 0) {
            setSliderImages(sliderImageUrls)
          }
        } catch (error) {
          console.error("Error fetching slider images:", error)
        }

        // Fetch story images
        const storyDoc = await getDoc(doc(db, "sections", "story"))
        if (storyDoc.exists() && storyDoc.data().imageUrls) {
          setStoryImages(storyDoc.data().imageUrls)
        }

        // Fetch large photo
        const largePhotoDoc = await getDoc(doc(db, "sections", "largePhoto"))
        if (largePhotoDoc.exists() && largePhotoDoc.data().imageUrl) {
          setLargePhoto(largePhotoDoc.data().imageUrl)
        }

        // Fetch guest review image
        const guestReviewDoc = await getDoc(doc(db, "sections", "guestReview"))
        if (guestReviewDoc.exists() && guestReviewDoc.data().imageUrl) {
          setGuestReviewImage(guestReviewDoc.data().imageUrl)
        }

        // Fetch all gallery images
        try {
          const galleryRef = ref(storage, '/gallery')
          const galleryResult = await listAll(galleryRef)
          const galleryImagesWithMetadata = await Promise.all(
            galleryResult.items.map(async (imageRef) => {
              try {
                const url = await getDownloadURL(imageRef)
                const metadata = await getMetadata(imageRef)
                return {
                  url,
                  timeCreated: metadata.timeCreated ? new Date(metadata.timeCreated) : new Date(),
                  name: imageRef.name
                }
              } catch (error) {
                return null
              }
            })
          )

          const sortedGalleryImages = galleryImagesWithMetadata
            .filter(item => item !== null)
            .sort((a, b) => {
              if (!a || !b) return 0
              return b.timeCreated.getTime() - a.timeCreated.getTime()
            })
            .map(item => item!.url)

          setGalleryImages(sortedGalleryImages.length > 0 ? sortedGalleryImages : ['/1.jpg', '/2.png', '/3.jpg'])
        } catch (error) {
          console.error("Error fetching gallery images:", error)
          setGalleryImages(['/1.jpg', '/2.png', '/3.jpg'])
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching content:", error)
        setLoading(false)
      }
    }

    fetchContent()

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (sliderImages.length === 0 || !sliderTrackRef.current) return

    const slider = sliderTrackRef.current
    let position = 0
    const speed = 0.5
    const totalImages = sliderImages.length

    const animate = () => {
      position += speed
      const firstChild = slider.children[0] as HTMLElement
      if (!firstChild) return

      const itemWidth = firstChild.offsetWidth + 10

      if (position >= itemWidth) {
        slider.style.transition = 'none'
        slider.appendChild(firstChild)
        position = position - itemWidth
        slider.style.transform = `translateX(-${position}px)`
        slider.offsetHeight
        slider.style.transition = 'transform 0.1s linear'
      } else {
        slider.style.transform = `translateX(-${position}px)`
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    const timeoutId = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate)
    }, 500)

    return () => {
      clearTimeout(timeoutId)
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [sliderImages])

  const nextGalleryImage = () => {
    setCurrentGalleryIndex((prev) => {
      const maxSlides = Math.ceil(galleryImages.length / 3)
      return prev < maxSlides - 1 ? prev + 1 : prev
    })
  }

  const prevGalleryImage = () => {
    setCurrentGalleryIndex((prev) => (prev > 0 ? prev - 1 : 0))
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const placeholderSliderImages = [
    "/placeholder.svg?height=200&width=400&text=Slider+1",
    "/placeholder.svg?height=200&width=400&text=Slider+2",
    "/placeholder.svg?height=200&width=400&text=Slider+3",
  ]

  const placeholderStoryImages = ["/placeholder.svg?height=240&width=320&text=Story+1"]
  const placeholderLargePhoto = "/placeholder.svg?height=400&width=1200&text=Large+Photo"
  const placeholderGuestReviewImage = "/placeholder.svg?height=500&width=500&text=Guest+Review"

  return (
    <div className="relative min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              className="lg:hidden focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-orange-400" /> : <Menu className="w-6 h-6 text-orange-400" />}
            </button>
            
            <div className="hidden lg:flex lg:space-x-8">
              <a href="/" className="text-sm text-orange-400">HOME</a>
              <a href="/rooms" className="text-sm hover:text-orange-400 transition-colors">COTTAGES</a>
              <a href="/gallery" className="text-sm hover:text-orange-400 transition-colors">GALLERY</a>
              <a href="/fine-dining" className="text-sm hover:text-orange-400 transition-colors">RESTAURANT</a>
              <a href="/wines" className="text-sm hover:text-orange-400 transition-colors">WINE</a>
              <a href="/contact" className="text-sm hover:text-orange-400 transition-colors">CONTACT</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black"
                asChild
              >
                <Link href="/rooms">Book Now</Link>
              </Button>

              {user ? (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{user.displayName || user.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-orange-400 hover:text-orange-300"
                  >
                    <span className="hidden sm:inline">Sign Out</span>
                    <X className="sm:hidden w-4 h-4" />
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
                    <span className="hidden sm:inline">Login</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
          
          {mobileMenuOpen && (
            <div className="lg:hidden pt-4 pb-2 space-y-2 border-t border-gray-700 mt-4">
              <a href="/" className="block py-2 text-sm text-orange-400" onClick={() => setMobileMenuOpen(false)}>HOME</a>
              <a href="/rooms" className="block py-2 text-sm hover:text-orange-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>COTTAGES</a>
              <a href="/gallery" className="block py-2 text-sm hover:text-orange-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>GALLERY</a>
              <a href="/fine-dining" className="block py-2 text-sm hover:text-orange-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>RESTAURANT</a>
              <a href="/wines" className="block py-2 text-sm hover:text-orange-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>WINE</a>
              <a href="/contact" className="block py-2 text-sm hover:text-orange-400 transition-colors" onClick={() => setMobileMenuOpen(false)}>CONTACT</a>
              {user && isAdmin && (
                <Link href="/admin/dashboard" className="flex items-center py-2 text-sm text-orange-400 hover:text-orange-300" onClick={() => setMobileMenuOpen(false)}>
                  <Settings className="mr-2 h-4 w-4" />
                  ADMIN PANEL
                </Link>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full bg-black aspect-[3/4] md:aspect-video">
        <div className="absolute inset-0">
          <Image 
            src={heroImage} 
            alt="Hotel in Kakheti - Serodani Boutique Wooden Cottages" 
            width={1200} 
            height={800} 
            priority
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center h-full">
          <div className="text-center text-white px-4">
            <div className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">Hotel Serodani</div>
            <div className="text-xl sm:text-2xl md:text-3xl tracking-widest font-light" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Wooden Cottages in the heart of Kaketi, Georgia
            </div>
          </div>
        </div>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap');
        `}</style>
      </section>

      {/* Tagline Section */}
      <section className="py-16 bg-[#242323] text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-wide text-white">Hidden Paradise in Telavi</h1>
        {loading && (
          <div className="flex justify-center items-center mt-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-400"></div>
          </div>
        )}
      </section>

      {/* Image Gallery Preview - Infinite Slider */}
      <section className="py-8 bg-[#242323]">
        <div className="w-full px-0 overflow-hidden">
          <div className="slider-container overflow-hidden w-full">
            <div ref={sliderTrackRef} className="slider-track flex">
              {loading ? null : (
                sliderImages.map((src, i) => (
                  <div
                    key={i}
                    className="relative flex-shrink-0 h-[280px]"
                    style={{ width: "350px", marginRight: "10px" }}
                  >
                    <Image
                      src={src}
                      alt={`Boutique hotel in Kakheti - Wooden cottages in Georgia ${i + 1}`}
                      width={350}
                      height={280}
                      className="object-cover"
                      loading={i < 3 ? "eager" : "lazy"}
                      priority={i < 3}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
          <style jsx global>{`
            .slider-container {
              width: 100vw;
              position: relative;
              left: 50%;
              right: 50%;
              margin-left: -50vw;
              margin-right: -50vw;
              overflow: hidden;
            }
            .slider-track {
              padding: 10px 0;
              width: fit-content;
              display: flex;
              flex-wrap: nowrap;
              transition: transform 0.1s linear;
            }
          `}</style>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-[#242323]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8 text-white">OUR STORY</h2>
          <div className="max-w-4xl mx-auto space-y-6 text-gray-300 leading-relaxed mb-12">
            <p>
              Located in the heart of Georgia's famous wine region, Kakheti, Hotel Serodani is a peaceful hideaway in Village Shalauri, surrounded by nature. With stunning views of the Alazani Valley and Caucasus Mountains, our eco-friendly wooden cottages offer comfort, calm, and authentic Georgian charm.
            </p>
            <p>
              Cosy nature, Fresh air, Outdoor pools, Georgian Restaurant, our handcrafted wine and warm hospitality—Serodani is a perfect place for families, couples, and friends seeking true relaxation.
            </p>
            <p>
              <strong className="text-2xl">Cottages</strong><br />
              We offer 6 uniquely designed wooden cottages, Each one designed for comfort and privacy, ideal for romantic getaways, family trips, or a peaceful weekend with friends.
            </p>
            <p>
              <strong className="text-2xl">Food & Wine</strong><br />
              Our on-site restaurant serves traditional Georgian cuisine made with fresh, local ingredients. We also produce a variety of Georgian wines, aged in our own cellar.
            </p>
            <p>
              Hotel Serodani is only 2 kms away from Telavi. Tbilisi Airport is 62 km away. (1.5 hour). There is a bus stop next to the hotel.
            </p>
          </div>

          <div className="w-full overflow-hidden mb-20">
            <div className="w-full max-w-7xl mx-auto">
              <div 
                className="relative w-full mb-0"
                style={{ paddingTop: `${(1365 / 5005) * 100}%` }}
              >
                <Image
                  src={storyImages[0] || placeholderStoryImages[0]}
                  alt="Nature hotel in Georgia - Georgian countryside hotel"
                  width={1200}
                  height={1365}
                  className="object-contain"
                  loading="lazy"
                  sizes="(max-width: 768px) 90vw, 1200px"
                />
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto space-y-6 text-gray-300 leading-relaxed">
            <h2 className="text-3xl font-bold mb-8 text-center text-white">ACTIVITIES</h2>
            <p><strong>Outdoor swimming pools</strong><br />Swim in our swimming pools with stunning views of the Alazani Valley and the Caucasus Mountains.</p>
            <p><strong>Culinary Masterclasses</strong><br />Learn to prepare and shape Georgia's beloved dumplings by hand, guided by local cooks.</p>
            <p><strong>Churchkhela Workshops</strong><br />Discover how to make this sweet, traditional Georgian snack from natural grape juice and nuts.</p>
            <p><strong>Georgian Wine & Tasting Experience</strong><br />Taste a variety of our house wines, learn about the Qvevri method, and buy bottles to take home.</p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 bg-[#242323]">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">GALLERY</h2>
          <div className="relative max-w-5xl mx-auto">
            <div className="overflow-hidden rounded-lg">
              <div className="flex transition-transform duration-500 ease-in-out"
                   style={{ transform: `translateX(-${currentGalleryIndex * 100}%)` }}>
                {Array.from({ length: Math.ceil(galleryImages.length / 3) }).map((_, slideIndex) => (
                  slideIndex <= currentGalleryIndex + 1 && (
                    <div key={slideIndex} className="flex-none w-full">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {galleryImages.slice(slideIndex * 3, (slideIndex + 1) * 3).map((src, i) => (
                          <div key={i} className="relative h-[300px] rounded-lg overflow-hidden shadow-lg">
                            <Image
                              src={src}
                              alt={`Cottage stay in Kakheti - Gallery of Hotel Serodani ${i + 1}`}
                              width={400}
                              height={300}
                              className="object-cover"
                              loading={slideIndex === 0 ? "eager" : "lazy"}
                              priority={slideIndex === 0}
                              onError={(e) => {
                                const parent = (e.target as HTMLElement).parentElement
                                if (parent) parent.style.display = 'none'
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 border-orange-400 z-10"
              onClick={prevGalleryImage}
              disabled={currentGalleryIndex === 0}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 border-orange-400 z-10"
              onClick={nextGalleryImage}
              disabled={currentGalleryIndex >= Math.ceil(galleryImages.length / 3) - 1}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
            
            <div className="flex justify-center mt-6 gap-2">
              {Array.from({ length: Math.ceil(galleryImages.length / 3) }).map((_, i) => (
                <button
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i === currentGalleryIndex ? 'bg-orange-400' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  onClick={() => setCurrentGalleryIndex(i)}
                  aria-label={`View gallery page ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Guest Review Photo */}
      <section className="py-20 bg-[#242323]">
        <div className="container mx-auto px-4">
          <div className="relative w-full mx-auto h-[630px] max-w-[980px]">
            <Image
              src={guestReviewImage || placeholderGuestReviewImage}
              alt="Wine hotel Georgia - Guest reviews of Hotel Serodani in Kakheti"
              width={980}
              height={630}
              className="object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 980px"
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-[#242323]">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">CONTACT US</h2>
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold mb-6 text-white">Address</h3>
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
                <div className="flex items-center space-x-3 mt-2">
                  <a href="https://www.google.com/maps/place/Serodani/@41.9062137,45.4954591,17z" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
                    View on Google Maps
                  </a>
                </div>
                <div className="flex items-center space-x-3 mt-2">
                  <a href="https://serodani.ps.me" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
                    serodani.ps.me
                  </a>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-6 mt-8 text-white">Contact</h3>
              <p className="text-gray-300">
                For reservations and inquiries, please contact us directly or use our online booking system.
              </p>
            </div>
            <div className="relative h-80 rounded-lg overflow-hidden">
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

      <Footer />
    </div>
  )
}