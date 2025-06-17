"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { User, MapPin, Menu, X } from "lucide-react"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import { getDoc, doc } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import { Footer } from "@/components/Footer"
import { getDownloadURL, ref } from "firebase/storage"
import { fetchWineImagesSimple } from "@/lib/data-fetching"

export default function WinesPage() {
  const { user, signOut } = useAuth()
  const [wineImages, setWineImages] = useState<string[]>([])
  const [heroImage, setHeroImage] = useState<string | null>(null) // null-ით დავიწყოთ
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // ჰერო სურათის წამოღება Firebase-დან
        const heroDoc = await getDoc(doc(db, "sections", "wineHero"))
        if (heroDoc.exists() && heroDoc.data().imageUrl) {
          try {
            const heroUrl = heroDoc.data().imageUrl;
            
            // თუ URL იწყება https:// ფორმატით, პირდაპირ გამოვიყენოთ
            if (heroUrl.startsWith('https://')) {
              setHeroImage(heroUrl);
            } else {
              // თუ ეს არის Firebase Storage path, გადავაკონვერტიროთ URL-ად
              const storageRef = ref(storage, heroUrl);
              const downloadUrl = await getDownloadURL(storageRef);
              setHeroImage(downloadUrl);
            }
            
            console.log("Wine hero loaded from Firebase");
          } catch (error) {
            console.error("Error loading hero image:", error);
          }
        } else {
          console.log("Wine hero not found in Firebase");
        }
        
        // ახალი გამარტივებული ფუნქცია ღვინის სურათების წამოსაღებად
        const wineUrls = await fetchWineImagesSimple();
        
        if (wineUrls.length > 0) {
          setWineImages(wineUrls);
          console.log(`Loaded ${wineUrls.length} wine images`);
        } else {
          console.log("No wine images found");
          setWineImages([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching wine content:", error);
        setWineImages([]); // ცარიელი მასივი შეცდომის შემთხვევაში
        setLoading(false);
      }
    }

    fetchContent()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm text-white">
        <div className="container mx-auto px-4 py-4">
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
              <a href="/wines" className="text-sm text-orange-400">
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
                <Link href="/rooms">Book Now</Link>
              </Button>

              {/* Login/User Menu */}
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
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden pt-4 pb-2 space-y-2 border-t border-gray-700 mt-4">
              <a 
                href="/" 
                className="block py-2 text-sm hover:text-orange-400 transition-colors"
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
                className="block py-2 text-sm text-orange-400"
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
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Brick Background */}
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
          <div className="bg-gray-200 h-full w-full flex items-center justify-center text-gray-500">
            <p>Hero image not available</p>
          </div>
        )}
      </section>

      {/* Great Wines Section */}
      <section className="py-16 bg-white relative">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-light italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Our Wine – Tradition and Taste from the Heart of Kakheti
          </h2>
        </div>
        
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-400"></div>
            </div>
          ) : (
            <>
              {wineImages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-600">No wine images available at this time.</p>
                </div>
              ) : (
                <>
                  {/* ზედა ღვინის სექცია */}
                  <div className="flex flex-col md:flex-row gap-8 mb-16">
                    {/* ღვინის სურათები */}
                    <div className="md:w-3/4">
                      <div className="grid grid-cols-3 gap-4">
                        {wineImages.slice(0, 3).map((src, i) => (
                          <div key={i} className="relative h-[320px]">
                            <Image
                              src={src}
                              alt={`Georgian wine from Kakheti - Wine hotel experience at Serodani`}
                              fill
                              className="object-cover"
                              loading={i === 0 ? "eager" : "lazy"}
                              sizes="(max-width: 768px) 100vw, 33vw"
                              onError={(e) => {
                                const container = (e.target as HTMLImageElement).parentElement;
                                if (container) container.style.display = "none";
                              }}
                              unoptimized
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* "Matisi" ინფორმაცია */}
                    <div className="md:w-1/4 flex items-center">
                      <div>
                        <p className="text-gray-700 text-xl">
                        At Hotel Serodani, wine is a living tradition. We take great pride in producing our own homemade wines, crafted with passion and respect for centuries-old Georgian winemaking methods.
Our collection includes some of Georgia's most celebrated varieties:

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* მწვანე ნაწილი */}
                  <div className="bg-[#A9B4A3] py-12 px-8 mb-16">
                    <div className="container mx-auto text-center">
                      <p className="text-lg mb-4">
                      <strong>Saperavi</strong> – Georgia's iconic deep red wine, known for its rich, bold taste and full body
                      </p>
                      <p className="text-lg mb-4">
                      <strong>Kisi</strong> – a distinctive and aromatic white wine, rich in character
                      </p>
                      <p className="text-lg mb-4">
                      <strong>Tvishi</strong> – a delicate white wine with fresh floral notes
                      </p>
                      <p className="text-lg mb-4">
                      <strong>Kindzmarauli</strong> – a naturally semi-sweet red wine, famous for its vibrant fruit flavors
                      </p>
                      <p className="text-lg mb-4">
                      <strong>Rosé</strong> – a fresh, elegant wine perfect for any occasion
                      </p>
                      <p className="text-lg mb-4">
                      <strong>Each bottle is made following traditional techniques.</strong>
                      </p>
                      <p className="text-lg mb-4">
                      </p>
                    </div>
                  </div>

                  {/* ქვედა Chacha სექცია */}
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* ჭაჭის ინფორმაცია */}
                    <div className="md:w-1/3 flex flex-col justify-center">
                      <div className="space-y-8">
                        <p className="text-gray-700 text-xl">
                          We warmly invite our guests to experience the magic of Georgian winemaking with a guided wine tour through our wine cellar. Here, you'll learn about the ancient qvevri method, the history behind each varietal, and the craftsmanship involved in producing our wines.
                        </p>
                        <p className="text-gray-700 text-xl">
                          Guests also have the opportunity to purchase bottles directly from our cellar, allowing you to take a piece of Kakheti's heritage home with you.
                        </p>
                      </div>
                    </div>

                    {/* ჭაჭის სურათები */}
                    <div className="md:w-2/3">
                      <div className="grid grid-cols-3 gap-4">
                        {wineImages.slice(3, 6).map((src, i) => (
                          <div key={i} className="relative h-[320px]">
                            <Image
                              src={src}
                              alt={`Traditional wine tasting in Kakheti - Georgian winemaking at Hotel Serodani`}
                              fill
                              className="object-cover"
                              loading="lazy"
                              sizes="(max-width: 768px) 100vw, 33vw"
                              onError={(e) => {
                                const container = (e.target as HTMLImageElement).parentElement;
                                if (container) container.style.display = "none";
                              }}
                              unoptimized
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap');
      `}</style>

      {/* Footer */}
      <Footer />
    </div>
  )
}
