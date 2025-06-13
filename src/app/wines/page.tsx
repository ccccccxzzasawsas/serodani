"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { User, MapPin } from "lucide-react"
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
              <a href="/wines" className="text-sm text-orange-400">
                WINE
              </a>
              <a href="/#contact" className="text-sm hover:text-orange-400 transition-colors">
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

      {/* Hero Section with Brick Background */}
      <section className="relative h-[650px] w-full">
        {heroImage ? (
          <div className="absolute inset-0">
            <Image 
              src={heroImage}
              alt="Wine Cellar Hero"
              fill
              className="object-cover object-center"
              priority
              sizes="100vw"
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
          <h2 className="text-5xl font-light italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Great wines tell a story</h2>
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
                              alt={`Wine image ${i + 1}`}
                              fill
                              className="object-cover"
                              loading={i === 0 ? "eager" : "lazy"}
                              sizes="(max-width: 768px) 100vw, 33vw"
                              onError={(e) => {
                                const container = (e.target as HTMLImageElement).parentElement;
                                if (container) container.style.display = "none";
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* "Matisi" ინფორმაცია */}
                    <div className="md:w-1/4 flex items-center">
                      <div>
                        <p className="text-gray-700">
                          "Matisi" offers variety of naturally made unique wines produced in the village located only 30 minutes away from the hotel (close to Alaverdi monastery).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* მწვანე ნაწილი */}
                  <div className="bg-[#A9B4A3] py-12 px-8 mb-16">
                    <div className="container mx-auto text-center">
                      <p className="text-xl mb-6">
                        Almost everywhere you go, you'll be invited to drink a glass of traditional Qvevri wine in Georgia.
                      </p>
                      <p className="text-xl mb-6">
                        However, when you visit us, you won't have to go far for this experience since we make a variety of wines under name "Matisi" and offer it to our guests.
                      </p>
                    </div>
                  </div>

                  {/* ქვედა Chacha სექცია */}
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* ჭაჭის ინფორმაცია */}
                    <div className="md:w-1/3 flex flex-col justify-center">
                      <div className="space-y-8">
                        <p className="text-gray-700">
                          Our bar offers a wide selection of Chacha with natural ingredients and made by old Kakhetian traditional method.
                        </p>
                        <p className="text-gray-700">
                          Try the variety: Mint, Cinnamon, Tarragon and Traditional...
                        </p>
                        <p className="text-gray-700">
                          Name the favorite one!
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
                              alt={`Chacha image ${i + 1}`}
                              fill
                              className="object-cover"
                              loading="lazy"
                              sizes="(max-width: 768px) 100vw, 33vw"
                              onError={(e) => {
                                const container = (e.target as HTMLImageElement).parentElement;
                                if (container) container.style.display = "none";
                              }}
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
