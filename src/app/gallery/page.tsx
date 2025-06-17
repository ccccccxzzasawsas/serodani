"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { User, X, Menu } from "lucide-react"
import Link from "next/link"
import { collection, getDoc, doc, getDocs } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import { Footer } from "@/components/Footer"
import { getDownloadURL, ref, listAll, getMetadata } from "firebase/storage"

export default function GalleryPage() {
  const { user, signOut } = useAuth()
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [heroImage, setHeroImage] = useState<string | null>(null) // დეფოლტად არ ვაყენებთ ლოკალურ სურათს
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // გავასუფთავოთ ბრაუზერის ქეში სურათებიდან
    if (typeof window !== 'undefined') {
      // ლოკალური სურათების ქეშის წასაშლელი ფუნქცია
      const clearImageCache = () => {
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              caches.delete(cacheName);
              console.log("Deleted gallery cache:", cacheName);
            });
          });
        }

        // ასევე შეგვიძლია ლოკალ სტორეჯში დავინახოთ რომ ქეში გავსუფთავეთ
        localStorage.setItem("galleryCacheCleared", new Date().toISOString());
        console.log("Gallery browser cache clear attempted");
      };

      clearImageCache();
    }
    
    const fetchContent = async () => {
      try {
        // ჰერო სურათის წამოღება Firebase-დან
        const heroDoc = await getDoc(doc(db, "sections", "galleryHero"))
        if (heroDoc.exists() && heroDoc.data().imageUrl) {
          const heroUrl = heroDoc.data().imageUrl;
          setHeroImage(heroUrl);
          console.log("Gallery hero loaded from Firebase:", heroUrl)
        } else {
          console.log("Gallery hero not found in Firebase")
        }
        
        // გალერიის სურათების წამოღება Firebase Storage-დან /gallery ფოლდერიდან
        try {
          console.log("Fetching gallery images from Firebase Storage '/gallery' folder...");
          const galleryRef = ref(storage, '/gallery');
          const galleryResult = await listAll(galleryRef);
          
          if (galleryResult.items.length > 0) {
            // შევაგროვოთ ყველა ფაილის მეტადატა და URL ერთდროულად
            const galleryImagesWithMetadata = await Promise.all(
              galleryResult.items.map(async (imageRef) => {
                try {
                  const url = await getDownloadURL(imageRef);
                  const metadata = await getMetadata(imageRef);
                  return {
                    url: url,
                    timeCreated: metadata.timeCreated ? new Date(metadata.timeCreated) : new Date(),
                    name: imageRef.name
                  };
                } catch (error) {
                  console.error(`Error processing gallery image ${imageRef.name}:`, error);
                  return null;
                }
              })
            );
            
            // გავფილტროთ null მნიშვნელობები და დავალაგოთ თარიღის მიხედვით (ახლიდან ძველისკენ)
            const sortedGalleryImages = galleryImagesWithMetadata
              .filter(item => item !== null)
              .sort((a, b) => {
                if (!a || !b) return 0;
                return b.timeCreated.getTime() - a.timeCreated.getTime();
              })
              .map(item => item!.url);
            
            if (sortedGalleryImages.length > 0) {
              setGalleryImages(sortedGalleryImages);
              console.log("Gallery images loaded and sorted from Firebase Storage:", sortedGalleryImages.length);
            } else {
              console.log("No valid gallery images found in Firebase Storage");
              setGalleryImages([]);
            }
          } else {
            console.log("No gallery images found in Firebase Storage");
            setGalleryImages([]);
          }
        } catch (error) {
          console.error("Error fetching gallery images from Firebase Storage:", error);
          setGalleryImages([]);
        }
      } catch (error) {
        console.error("Error fetching gallery content:", error)
        setGalleryImages([]); // ცარიელი მასივი შეცდომის შემთხვევაში
      } finally {
        setLoading(false)
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

  const openModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    document.body.style.overflow = 'hidden'; // დავბლოკოთ სქროლი როცა მოდალი ღიაა
  }

  const closeModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto'; // დავაბრუნოთ სქროლი როცა მოდალს დავხურავთ
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
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
              <a href="/gallery" className="text-sm text-orange-400">
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
                className="block py-2 text-sm text-orange-400"
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
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="relative w-full aspect-[3/4] md:aspect-video">
        {/* გამოვაჩინოთ ჰერო სურათი მხოლოდ თუ ის არსებობს */}
        {heroImage ? (
          <Image
            src={heroImage}
            alt="Gallery - Hotel Serodani in Kakheti, Georgia"
            fill
            priority
            className="object-cover object-center"
          />
        ) : (
          <div className="bg-gray-200 h-full w-full flex items-center justify-center text-gray-500">
            <p>Hero image not available</p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          {/* Text removed */}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 flex-grow">
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-400"></div>
          </div>
        ) : (
          <>
            {galleryImages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">No gallery images available at this time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-auto">
                {galleryImages.map((image, index) => (
                  <div key={index} className="relative overflow-hidden rounded-md group cursor-pointer">
                    <div 
                      className="aspect-[4/3] relative"
                      onClick={() => openModal(image)}
                    >
                      <Image
                        src={image}
                        alt={`Gallery image ${index + 1}`}
                        width={400}
                        height={300}
                        unoptimized
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // ფოტო შეცდომის შემთხვევაში მთლიანად წავშალოთ კონტეინერიდან
                          const container = (e.target as HTMLImageElement).closest('.relative');
                          if (container) {
                            (container as HTMLElement).style.display = "none";
                          }
                        }}
                      />
                      {/* ჰოვერის ახალი ეფექტი ტექსტის გარეშე */}
                      <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal for full-screen image */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={closeModal}
        >
          <button
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70"
            onClick={closeModal}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="max-w-[90vw] max-h-[90vh]">
            <img src={selectedImage} alt="Hotel in Kakheti - Serodani gallery view" className="max-w-full max-h-[90vh] object-contain" />
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}
