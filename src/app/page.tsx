"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, ChevronLeft, ChevronRight, Menu, X } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/Footer"
import { getLocalStorageImages } from "@/lib/local-images"

export default function KviriaHotel() {
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0)
  const [heroImage, setHeroImage] = useState("")
  const [sliderImages, setSliderImages] = useState<string[]>([])
  const [storyImages, setStoryImages] = useState<string[]>([])
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [galleryFailedUrls, setGalleryFailedUrls] = useState<Set<string>>(new Set())
  const [guestReviewImage, setGuestReviewImage] = useState("")
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const sliderTrackRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    setHeroImage(getLocalStorageImages("hero", { sort: "updatedDesc" })[0] || "")
    setSliderImages(getLocalStorageImages("slider", { sort: "createdAsc" }))
    setStoryImages(getLocalStorageImages("story", { sort: "createdAsc" }))
    setGalleryImages(getLocalStorageImages("gallery", { sort: "createdDesc" }))
    setGuestReviewImage(getLocalStorageImages("guestReview", { sort: "updatedDesc" })[0] || "")
    setLoading(false)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // áƒ’áƒáƒ”áƒ¨áƒ•áƒáƒ¡ áƒªáƒáƒ¢áƒ áƒ“áƒáƒ§áƒáƒ•áƒœáƒ”áƒ‘áƒ˜áƒ—, áƒ áƒáƒ› DOM-áƒ˜ áƒ“áƒáƒ áƒ”áƒœáƒ“áƒ”áƒ áƒ“áƒ”áƒ¡
    const timeoutId = setTimeout(() => {
      const slider = sliderTrackRef.current;
      if (!slider || slider.children.length <= 1) {
        return;
      }
      
      let position = 0;
      const speed = 0.5; // áƒ¡áƒ˜áƒ©áƒ¥áƒáƒ áƒ” áƒžáƒ˜áƒ¥áƒ¡áƒ”áƒšáƒ”áƒ‘áƒ¨áƒ˜
      
      // áƒ›áƒáƒ áƒ¢áƒ˜áƒ•áƒ˜ áƒáƒœáƒ˜áƒ›áƒáƒªáƒ˜áƒ˜áƒ¡ áƒ¤áƒ£áƒœáƒ¥áƒªáƒ˜áƒ
      const animate = () => {
        position += speed;
        
        // áƒ áƒáƒªáƒ áƒžáƒ˜áƒ áƒ•áƒ”áƒšáƒ˜ áƒ¡áƒ£áƒ áƒáƒ—áƒ˜ áƒ¡áƒ áƒ£áƒšáƒáƒ“ áƒ’áƒáƒ•áƒ áƒ”áƒ™áƒ áƒáƒœáƒ˜áƒ“áƒáƒœ, áƒ’áƒáƒ“áƒáƒ˜áƒ¢áƒáƒœáƒ” áƒ‘áƒáƒšáƒáƒ¨áƒ˜ áƒ£áƒ®áƒ˜áƒšáƒáƒ•áƒáƒ“
        const firstChild = slider.children[0] as HTMLElement;
        if (!firstChild) return; // áƒ“áƒáƒ•áƒ áƒ¬áƒ›áƒ£áƒœáƒ“áƒ”áƒ— áƒ áƒáƒ› firstChild áƒáƒ áƒ¡áƒ”áƒ‘áƒáƒ‘áƒ¡
        
        const itemWidth = firstChild.offsetWidth + 10; // +10 áƒ›áƒáƒ áƒ¯áƒ˜áƒœáƒ˜áƒ¡áƒ—áƒ•áƒ˜áƒ¡
        
        if (position >= itemWidth) {
          // áƒ“áƒáƒ•áƒ›áƒáƒšáƒáƒ— áƒ’áƒáƒ“áƒáƒ¢áƒáƒœáƒ˜áƒ¡ áƒáƒœáƒ˜áƒ›áƒáƒªáƒ˜áƒ - áƒ’áƒáƒ“áƒáƒ•áƒ˜áƒ§áƒ•áƒáƒœáƒáƒ— áƒžáƒáƒ–áƒ˜áƒªáƒ˜áƒ 0-áƒ–áƒ”, áƒ’áƒáƒ“áƒáƒ•áƒ˜áƒ¢áƒáƒœáƒáƒ— áƒ”áƒšáƒ”áƒ›áƒ”áƒœáƒ¢áƒ˜ áƒ“áƒ áƒ¨áƒ”áƒ›áƒ“áƒ”áƒ’ áƒ˜áƒ¡áƒ”áƒ• áƒ“áƒáƒ•áƒáƒ‘áƒ áƒ£áƒœáƒáƒ— CSS áƒ¢áƒ áƒáƒœáƒ–áƒ˜áƒ¨áƒ”áƒœáƒ˜
          slider.style.transition = 'none';
          slider.appendChild(firstChild);
          position = 0;
          slider.style.transform = `translateX(-${position}px)`;
          
          // áƒ•áƒáƒ«áƒáƒšáƒáƒ— áƒ áƒ”áƒ¤áƒšáƒáƒ£, áƒ áƒáƒ› áƒªáƒ•áƒšáƒ˜áƒšáƒ”áƒ‘áƒ”áƒ‘áƒ˜ áƒ’áƒáƒ›áƒáƒ©áƒœáƒ“áƒ”áƒ¡ áƒ¢áƒ áƒáƒœáƒ–áƒ˜áƒ¨áƒ”áƒœáƒ˜áƒ¡ áƒ“áƒáƒ‘áƒ áƒ£áƒœáƒ”áƒ‘áƒáƒ›áƒ“áƒ”
          slider.offsetHeight; 
          
          // áƒ“áƒáƒ•áƒáƒ‘áƒ áƒ£áƒœáƒáƒ— áƒ¢áƒ áƒáƒœáƒ–áƒ˜áƒ¨áƒ”áƒœáƒ˜
          slider.style.transition = 'transform 0.1s linear';
        } else {
          slider.style.transform = `translateX(-${position}px)`;
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      // áƒ“áƒáƒ˜áƒ¬áƒ§áƒ” áƒáƒœáƒ˜áƒ›áƒáƒªáƒ˜áƒ
      animationRef.current = requestAnimationFrame(animate);
    }, 500); // áƒ“áƒáƒ•áƒáƒ‘áƒ áƒ£áƒœáƒáƒ— áƒ¡áƒáƒ¬áƒ§áƒ˜áƒ¡áƒ˜ áƒ“áƒáƒ§áƒáƒ•áƒœáƒ”áƒ‘áƒ
    
    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [sliderImages, loading]); // áƒ“áƒáƒ•áƒáƒ›áƒáƒ¢áƒáƒ— loading áƒ£áƒ™áƒáƒœ áƒ“áƒáƒ›áƒáƒ™áƒ˜áƒ“áƒ”áƒ‘áƒ£áƒšáƒ”áƒ‘áƒ”áƒ‘áƒ¨áƒ˜

  const [isMobile, setIsMobile] = useState(false)

  // áƒ›áƒ—áƒáƒ•áƒáƒ áƒ˜ áƒ¤áƒáƒ¢áƒáƒ¡ áƒžáƒ áƒ”áƒšáƒáƒ“áƒ˜ â€” áƒ‘áƒ áƒáƒ£áƒ–áƒ”áƒ áƒ˜ áƒ¥áƒ”áƒ¨áƒ˜áƒ áƒ”áƒ‘áƒ¡, áƒ©áƒáƒ¢áƒ•áƒ˜áƒ áƒ—áƒ•áƒ áƒ£áƒ¤áƒ áƒ áƒ¡áƒ¬áƒ áƒáƒ¤áƒ˜áƒ
  useEffect(() => {
    if (!heroImage || heroImage.includes("placeholder")) return
    const link = document.createElement("link")
    link.rel = "preload"
    link.as = "image"
    link.href = heroImage
    document.head.appendChild(link)
    return () => {
      try {
        document.head.removeChild(link)
      } catch (_) {}
    }
  }, [heroImage])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // áƒ›áƒ®áƒáƒšáƒáƒ“ áƒ•áƒáƒšáƒ˜áƒ“áƒ£áƒ áƒ˜ áƒ¡áƒ£áƒ áƒáƒ—áƒ”áƒ‘áƒ˜ + áƒšáƒ˜áƒ›áƒ˜áƒ¢áƒ˜ áƒ›áƒ—áƒáƒ•áƒáƒ  áƒ’áƒ•áƒ”áƒ áƒ“áƒ–áƒ” â€” áƒ áƒáƒ—áƒ áƒ¬áƒ”áƒ áƒ¢áƒ˜áƒšáƒ”áƒ‘áƒ˜ áƒáƒ  áƒ˜áƒ§áƒáƒ¡ áƒ«áƒáƒšáƒ˜áƒáƒœ áƒ‘áƒ”áƒ•áƒ áƒ˜
  const MAX_GALLERY_ON_HOME = 16 // áƒ›áƒáƒ¥áƒ¡ 4 áƒ¡áƒšáƒáƒ˜áƒ“áƒ˜ áƒ“áƒ”áƒ¡áƒ™áƒ¢áƒáƒžáƒ–áƒ”, 12 áƒ›áƒáƒ‘áƒ˜áƒšáƒ£áƒ áƒ–áƒ” â€” áƒ¬áƒ”áƒ áƒ¢áƒ˜áƒšáƒ”áƒ‘áƒ˜ áƒáƒ  áƒ˜áƒ§áƒáƒ¡ áƒ–áƒ”áƒ“áƒ›áƒ”áƒ¢áƒ˜
  const displayGalleryImages = useMemo(
    () => galleryImages
      .filter((url) => !galleryFailedUrls.has(url))
      .slice(0, MAX_GALLERY_ON_HOME),
    [galleryImages, galleryFailedUrls]
  )

  // Reset gallery index when switching between mobile/desktop or when display count changes
  useEffect(() => {
    const n = displayGalleryImages.length
    if (n === 0) return
    const maxSlides = isMobile ? n : Math.ceil(n / 3)
    if (currentGalleryIndex >= maxSlides) {
      setCurrentGalleryIndex(Math.max(0, maxSlides - 1))
    }
  }, [isMobile, displayGalleryImages.length, currentGalleryIndex])

  const nextGalleryImage = () => {
    const n = displayGalleryImages.length
    if (n === 0) return
    const maxSlides = isMobile ? n : Math.ceil(n / 3)
    setCurrentGalleryIndex((prev) => (prev < maxSlides - 1 ? prev + 1 : prev))
  }

  const prevGalleryImage = () => {
    setCurrentGalleryIndex((prev) => (prev > 0 ? prev - 1 : 0))
  }

  const placeholderStoryImages = [
    "/placeholder.svg?height=240&width=320&text=Story+1"
  ]

  const placeholderGuestReviewImage = "/placeholder.svg?height=500&width=500&text=Guest+Review"

  return (
    <div className="relative min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <button 
              className="lg:hidden focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-orange-400" />
              ) : (
                <Menu className="w-6 h-6 text-orange-400" />
              )}
            </button>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:space-x-8">
              <a href="/" className="text-sm text-orange-400">
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
              <a href="/contact" className="text-sm hover:text-orange-400 transition-colors">
                CONTACT
              </a>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black"
                asChild
              >
                <Link href="/booking?checkInDate=28.07.2025&checkOutDate=29.07.2025">Book Now</Link>
              </Button>

            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden pt-4 pb-2 space-y-2 border-t border-gray-700 mt-4">
              <a 
                href="/" 
                className="block py-2 text-sm text-orange-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                HOME
              </a>
              <a 
                href="/rooms" 
                className="block py-2 text-sm hover:text-orange-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                COTTAGES
              </a>
              <a 
                href="/gallery" 
                className="block py-2 text-sm hover:text-orange-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                GALLERY
              </a>
              <a 
                href="/fine-dining" 
                className="block py-2 text-sm hover:text-orange-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                RESTAURANT
              </a>
              <a 
                href="/wines" 
                className="block py-2 text-sm hover:text-orange-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                WINE
              </a>
              <a 
                href="/contact" 
                className="block py-2 text-sm hover:text-orange-400 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                CONTACT
              </a>
              {/* Book Now Button for Mobile */}
              <div className="py-2">
                <div onClick={() => setMobileMenuOpen(false)}>
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
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section â€” áƒžáƒšáƒ”áƒ˜áƒ¡áƒ°áƒáƒšáƒ“áƒ”áƒ áƒ˜ áƒáƒ  áƒ©áƒáƒœáƒ¡; áƒ¡áƒ£áƒ áƒáƒ—áƒ˜ áƒ›áƒ®áƒáƒšáƒáƒ“ áƒ áƒáƒªáƒ URL áƒ©áƒáƒ¢áƒ•áƒ˜áƒ áƒ—áƒ£áƒšáƒ˜áƒ, áƒ¥áƒ”áƒ¨áƒ˜áƒ áƒ”áƒ‘áƒ/áƒžáƒ áƒ˜áƒáƒ áƒ˜áƒ¢áƒ”áƒ¢áƒ˜ */}
      <section className="relative w-full bg-black aspect-[3/4] md:aspect-video md:max-h-[75vh]">
        <div className="absolute inset-0 bg-black">
          {heroImage && !heroImage.includes("placeholder") && (
            <Image
              src={heroImage}
              alt=""
              width={1200}
              height={800}
              priority
              fetchPriority="high"
              unoptimized
              className="w-full h-full object-cover"
              sizes="100vw"
            />
          )}
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center h-full">
          <div className="text-center text-white px-4">
            <div className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">Hotel Serodani
            </div>
            <div
              className="text-xl sm:text-2xl md:text-3xl tracking-widest font-extrabold text-white drop-shadow-lg"
              style={{ fontFamily: "'Cormorant Garamond', serif", textShadow: "2px 2px 8px rgba(0,0,0,0.7)" }}
            >
              Wooden Cottages in the heart of Kaketi, Georgia
            </div>
          </div>
        </div>
        
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap');
        `}</style>
      </section>

      {/* Tagline Section */}
      <section className="py-8 bg-[#242323] text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-wide text-white">Hidden Paradise in Telavi</h1>
     
        {/* áƒ©áƒáƒ¢áƒ•áƒ˜áƒ áƒ—áƒ•áƒ˜áƒ¡ áƒáƒœáƒ˜áƒ›áƒáƒªáƒ˜áƒ áƒ¢áƒ”áƒ¥áƒ¡áƒ¢áƒ˜áƒ¡ áƒ¥áƒ•áƒ”áƒ›áƒáƒ— */}
        {loading && (
          <div className="flex justify-center items-center mt-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-400"></div>
          </div>
        )}
      </section>

      {/* Image Gallery Preview - áƒ£áƒ¡áƒáƒ¡áƒ áƒ£áƒšáƒ áƒ¡áƒšáƒáƒ˜áƒ“áƒ”áƒ áƒ˜; áƒªáƒáƒ áƒ˜áƒ”áƒšáƒ˜ áƒ¡áƒ”áƒ¥áƒªáƒ˜áƒ áƒáƒ  áƒ©áƒáƒœáƒ¡ */}
      {!loading && sliderImages.length > 0 && (
      <section className="py-6 bg-[#242323]">
        <div className="w-full px-0 overflow-hidden">
          <div className="slider-container overflow-hidden w-full">
            <div ref={sliderTrackRef} className="slider-track flex">
              {[...sliderImages, ...sliderImages].map((src, i) => (
                <div
                  key={i}
                  className="relative flex-shrink-0 h-[280px] w-[350px] overflow-hidden"
                  style={{ marginRight: "10px" }}
                >
                  <Image
                    src={src}
                    alt={`Boutique hotel in Kakheti - Wooden cottages in Georgia`}
                    fill
                    className="object-cover"
                    sizes="350px"
                    loading={i < 6 ? "eager" : "lazy"}
                    unoptimized={true}
                  />
                </div>
              ))}
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
      )}

      {/* Our Story - Simplified with 3 photos */}
      <section className="pt-6 pb-12 bg-[#242323]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">OUR STORY</h2>
          <div className="max-w-4xl mx-auto space-y-4 text-gray-300 leading-relaxed mb-8">
            <p>
              Located in the heart of Georgia's famous wine region, Kakheti, Hotel Serodani is a peaceful hideaway in Village Shalauri, surrounded by nature. With stunning views of the Alazani Valley and Caucasus Mountains, our eco-friendly wooden cottages offer comfort, calm, and authentic Georgian charm.
            </p>
            <p>
              Cosy nature, Fresh air, Outdoor pools, Georgian Restaurant, our handcrafted wine and warm hospitalityâ€”Serodani is a perfect place for families, couples, and friends seeking true relaxation.
            </p>
            <p>
              <strong className="text-2xl">Cottages</strong><br />
              We offer 6 uniquely designed wooden cottages, Each one designed for comfort and privacy, ideal for romantic getaways, family trips, or a peaceful weekend with friends. Each cottage belongs to a different category and is fully equipped with all the necessary modern amenities to ensure your comfort and relaxation. Surrounded by gardens, mountain views, and fresh airâ€”you'll feel at home the moment you arrive.
            </p>
            <p>
              <strong className="text-2xl">Food & Wine</strong><br />
              Our on-site restaurant serves traditional Georgian cuisine made with fresh, local ingredients. We also produce a variety of Georgian wines, aged in our own cellar. Guests are welcome to join wine tastings and learn the stories behind each bottle. With two barsâ€”indoor and outdoorâ€”you'll always find a perfect spot.
            </p>
            <p>
              Hotel Serodani is only 2 kms away from Telavi. Tbilisi Airport is 62 km away. (1.5 hour). There is a bus stop next to the hotel.
            </p>
          </div>

          {/* Story Images - áƒ’áƒáƒ¤áƒáƒ áƒ—áƒáƒ”áƒ‘áƒ£áƒšáƒ˜ áƒ™áƒáƒœáƒ¢áƒ”áƒ˜áƒœáƒ”áƒ áƒ˜ áƒžáƒáƒœáƒáƒ áƒáƒ›áƒ£áƒšáƒ˜ áƒ¤áƒáƒ¢áƒáƒ”áƒ‘áƒ˜áƒ¡áƒ—áƒ•áƒ˜áƒ¡ */}
          <div className="w-full overflow-hidden mb-12">
            <div className="w-full max-w-7xl mx-auto">
              {storyImages.length > 0 ? (
                // áƒ›áƒ®áƒáƒšáƒáƒ“ áƒžáƒ˜áƒ áƒ•áƒ”áƒšáƒ˜ áƒ¤áƒáƒ¢áƒ áƒ’áƒáƒ›áƒáƒ•áƒáƒ©áƒ˜áƒœáƒáƒ—, áƒ—áƒ£ áƒ˜áƒ¡ áƒáƒ áƒ¡áƒ”áƒ‘áƒáƒ‘áƒ¡
                <div 
                  className="relative w-full mb-0"
                  style={{ 
                    paddingTop: `${(100 / 5005) * 100}%` /* áƒžáƒ áƒáƒžáƒáƒ áƒªáƒ˜áƒ˜áƒ¡ áƒ¨áƒ”áƒœáƒáƒ áƒ©áƒ£áƒœáƒ”áƒ‘áƒ: 5005:1365 */ 
                  }}
                >
                  <Image
                    src={storyImages[0]}
                    alt="Nature hotel in Georgia - Georgian countryside hotel"
                    width={1200}
                    height={1365}
                    className="object-contain"
                    loading="lazy"
                    sizes="(max-width: 768px) 90vw, 1200px"
                  />
                </div>
              ) : (
                // áƒ¤áƒáƒšáƒ‘áƒ”áƒ™ áƒ¤áƒáƒ¢áƒ, áƒ—áƒ£ áƒ¤áƒáƒ¢áƒ áƒáƒ  áƒáƒ áƒ˜áƒ¡
                <div 
                  className="relative w-full mb-0"
                  style={{ 
                    paddingTop: `${(1365 / 5005) * 100}%` /* áƒžáƒ áƒáƒžáƒáƒ áƒªáƒ˜áƒ˜áƒ¡ áƒ¨áƒ”áƒœáƒáƒ áƒ©áƒ£áƒœáƒ”áƒ‘áƒ: 5005:1365 */ 
                  }}
                >
                  <Image
                    src={placeholderStoryImages[0]}
                    alt="Nature hotel in Georgia - Georgian countryside hotel"
                    width={1200}
                    height={1365}
                    className="object-contain"
                    loading="lazy"
                    sizes="(max-width: 768px) 90vw, 1200px"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="max-w-4xl mx-auto space-y-4 text-gray-300 leading-relaxed">
            <h2 className="text-3xl font-bold mb-6 text-center text-white">ACTIVITIES</h2>
            <p>
              <strong>Outdoor swimming pools</strong><br />
              Swim in our swimming pools with stunning views of the Alazani Valley and the Caucasus Mountains.
            </p>
            <p>
              <strong>Culinary Masterclasses</strong><br />
              We offer a truly authentic experience through Georgian cooking masterclasses. Make Your Own Khinkali â€“ Learn to prepare and shape Georgia's beloved dumplings by hand, guided by local cooks.
            </p>
            <p>
              <strong>Churchkhela Workshops</strong><br />
              Discover how to make this sweet, traditional Georgian snack from natural grape juice and nuts.
            </p>
            <p>
              <strong>Georgian Wine & Tasting Experience</strong><br />
              We proudly produce our own Georgian wine using traditional methods passed down through generations. Grown and made right here in Kakheti, our wine cellar is an authentic space where guests can: Taste a variety of our house wines, Learn about the Qvevri method of Georgian winemaking, Buy bottles to take home as a gift or memory.
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-12 bg-[#242323]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-8 text-white">GALLERY</h2>
          
          {displayGalleryImages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-400">áƒ’áƒáƒšáƒ”áƒ áƒ˜áƒ˜áƒ¡ áƒ¤áƒáƒ¢áƒáƒ”áƒ‘áƒ˜ áƒ¯áƒ”áƒ  áƒáƒ  áƒáƒ áƒ˜áƒ¡ áƒ®áƒ”áƒšáƒ›áƒ˜áƒ¡áƒáƒ¬áƒ•áƒ“áƒáƒ›áƒ˜.</p>
            </div>
          ) : (
            <>
              {/* Gallery Container with Navigation â€” áƒ¬áƒ”áƒ áƒ¢áƒ˜áƒšáƒ”áƒ‘áƒ˜ áƒ“áƒ áƒ¡áƒšáƒáƒ˜áƒ“áƒ”áƒ‘áƒ˜ áƒ›áƒ®áƒáƒšáƒáƒ“ displayGalleryImages-áƒ˜áƒ¡ áƒ›áƒ˜áƒ®áƒ”áƒ“áƒ•áƒ˜áƒ— */}
              <div className="relative max-w-5xl mx-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-orange-400 hover:bg-orange-500 text-white border-orange-400 px-4 py-3 rounded-lg disabled:opacity-50"
                  onClick={prevGalleryImage}
                  disabled={currentGalleryIndex === 0}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                
                <div className="flex-1 overflow-hidden rounded-lg">
                  <div className="md:hidden">
                    <div 
                      className="flex transition-transform duration-500 ease-in-out"
                      style={{ transform: `translateX(-${currentGalleryIndex * 100}%)` }}
                    >
                      {displayGalleryImages.map((src, i) => (
                        <div key={i} className="flex-none w-full">
                          <div className="relative h-[300px] rounded-lg overflow-hidden">
                            <Image
                              src={src}
                              alt="Gallery"
                              fill
                              className="object-cover"
                              sizes="100vw"
                              loading="lazy"
                              onError={() => setGalleryFailedUrls((prev) => new Set(prev).add(src))}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="hidden md:block">
                    <div 
                      className="flex transition-transform duration-500 ease-in-out"
                      style={{ transform: `translateX(-${currentGalleryIndex * 100}%)` }}
                    >
                      {Array.from({ length: Math.ceil(displayGalleryImages.length / 3) || 1 }).map((_, slideIndex) => (
                        <div key={slideIndex} className="flex-none w-full">
                          <div className="grid grid-cols-3 gap-3">
                            {displayGalleryImages.slice(slideIndex * 3, slideIndex * 3 + 3).map((src, i) => (
                              <div key={`${slideIndex}-${i}`} className="relative h-[300px] rounded-lg overflow-hidden">
                                <Image
                                  src={src}
                                  alt="Gallery"
                                  fill
                                  className="object-cover"
                                  sizes="33vw"
                                  loading="lazy"
                                  onError={() => setGalleryFailedUrls((prev) => new Set(prev).add(src))}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-orange-400 hover:bg-orange-500 text-white border-orange-400 px-4 py-3 rounded-lg disabled:opacity-50"
                  onClick={nextGalleryImage}
                  disabled={
                    isMobile
                      ? currentGalleryIndex >= displayGalleryImages.length - 1
                      : currentGalleryIndex >= Math.ceil(displayGalleryImages.length / 3) - 1
                  }
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
              
              {/* áƒ¬áƒ”áƒ áƒ¢áƒ˜áƒšáƒ”áƒ‘áƒ˜ â€” áƒ›áƒ®áƒáƒšáƒáƒ“ áƒ˜áƒ›áƒ“áƒ”áƒœáƒ˜, áƒ áƒáƒ›áƒ“áƒ”áƒœáƒ˜ áƒ¡áƒšáƒáƒ˜áƒ“áƒ˜áƒª áƒáƒ áƒ¡áƒ”áƒ‘áƒáƒ‘áƒ¡ */}
              <div className="flex justify-center mt-6 gap-2 flex-wrap">
                {Array.from({
                  length: isMobile ? displayGalleryImages.length : Math.ceil(displayGalleryImages.length / 3) || 1,
                }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === currentGalleryIndex ? 'bg-orange-400' : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                    onClick={() => setCurrentGalleryIndex(i)}
                    aria-label={`View page ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Guest Review Photo â€” áƒ áƒ”áƒ¡áƒžáƒáƒœáƒ¡áƒ˜áƒ£áƒšáƒ˜ áƒ¡áƒ˜áƒ›áƒáƒ¦áƒšáƒ”, áƒªáƒáƒ áƒ˜áƒ”áƒšáƒ˜ áƒ‘áƒšáƒáƒ™áƒ˜áƒ¡ áƒ¨áƒ”áƒ›áƒªáƒ˜áƒ áƒ”áƒ‘áƒ */}
      <section className="py-8 md:py-12 bg-[#242323]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="relative w-full mx-auto h-[280px] sm:h-[360px] md:h-[420px] lg:h-[500px] xl:h-[560px] max-w-[980px]">
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
      <section id="contact" className="py-12 bg-[#242323]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-8 text-white">CONTACT US</h2>
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
                  <a href="https://www.google.com/maps/place/Serodani/@41.9062137,45.4954591,17z/data=!4m9!3m8!1s0x404433f8b9e2e367:0x7dd2cf495cd7b4f!5m2!4m1!1i2!8m2!3d41.9062137!4d45.4954591!16s%2Fg%2F11v4514mjr?entry=ttu" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-orange-400 hover:underline">
                    View on Google Maps
                  </a>
                </div>
                <div className="flex items-center space-x-3 mt-2">
                  <a href="https://serodani.ps.me" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-orange-400 hover:underline">
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
