"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { User, X, ChevronLeft, ChevronRight, Menu } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/Footer"
import { collection, getDoc, doc, getDocs } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import { getDownloadURL, ref } from "firebase/storage"

export default function FineDiningPage() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [heroImage, setHeroImage] = useState("")
  const [diningImages, setDiningImages] = useState<string[]>([])
  const [menuImage, setMenuImage] = useState("")
  const [menuImages, setMenuImages] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [selectedImageContext, setSelectedImageContext] = useState<'menu' | 'dining' | 'single'>('single')
  const [currentMenuIndex, setCurrentMenuIndex] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [zoomPosition, setZoomPosition] = useState({ x: 0.5, y: 0.5 })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const sliderTrackRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  
  // ფუნქცია Firebase Storage URL-ის გასაწმენდად და დასაკონვერტირებლად
  const getProperImageUrl = async (url: string): Promise<string | null> => {
    // ვამოწმებთ Firebase Storage-ის URL-ს
    if (url.startsWith('gs://') || url.includes('firebasestorage.googleapis.com')) {
      try {
        // თუ URL იწყება gs:// ფორმატით ან შეიცავს firebasestorage, გადავაკონვერტიროთ https:// ფორმატში
        console.log("Converting Firebase Storage URL:", url);
        
        // თუ URL უკვე არის https:// ფორმატში, მაგრამ შეიცავს firebasestorage.googleapis.com
        if (url.startsWith('http')) {
          return url; // პირდაპირ დავაბრუნოთ ეს URL
        }
        
        // თუ URL არის gs:// ფორმატში, გადავაკონვერტიროთ https:// ფორმატში
        const storageRef = ref(storage, url);
        const httpsUrl = await getDownloadURL(storageRef);
        console.log("Converted URL:", httpsUrl);
        return httpsUrl;
      } catch (error) {
        // თუ შეცდომა მოხდა, არ გამოვიტანოთ საჯაროდ
        return null; // შეცდომის შემთხვევაში დავაბრუნოთ null
      }
    }
    
    // CORS პრობლემების გამო აღარ ვამოწმებთ URL-ის ვალიდურობას fetch მეთოდით
    // უბრალოდ ვაბრუნებთ URL-ს და სურათის კომპონენტი თავად დაიჭერს შეცდომას
    return url;
  };

  useEffect(() => {
    // გავასუფთავოთ ბრაუზერის ქეში სურათებიდან
    if (typeof window !== 'undefined') {
      // ლოკალური სურათების ქეშის წასაშლელი ფუნქცია
      const clearImageCache = () => {
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              caches.delete(cacheName);
              console.log("Deleted dining cache:", cacheName);
            });
          });
        }

        // ასევე შეგვიძლია ლოკალ სტორეჯში დავინახოთ რომ ქეში გავსუფთავეთ
        localStorage.setItem("diningCacheCleared", new Date().toISOString());
        console.log("Dining browser cache clear attempted");
      };

      clearImageCache();
    }
    
    const fetchContent = async () => {
      try {
        // ჰერო სურათის წამოღება Firebase-დან
        const heroDoc = await getDoc(doc(db, "sections", "diningHero"))
        if (heroDoc.exists() && heroDoc.data().imageUrl) {
          const heroUrl = await getProperImageUrl(heroDoc.data().imageUrl);
          if (heroUrl) {
            setHeroImage(heroUrl);
            console.log("Dining hero loaded from Firebase");
          } else {
            console.log("Dining hero URL not valid, not displaying any hero");
          }
        } else {
          console.log("Dining hero not found in Firebase");
        }
        
        // სადილის სურათების წამოღება Firebase-დან
        console.log("Fetching dining images from Firebase collection 'dining'...");
        const diningSnapshot = await getDocs(collection(db, "dining"))
        
        // დავალაგოთ დოკუმენტები createdAt-ის მიხედვით, ახლიდან ძველისკენ
        const sortedDocs = diningSnapshot.docs
          .map(doc => ({ id: doc.id, data: doc.data() }))
          .filter(doc => doc.data.url) // მხოლოდ ის დოკუმენტები, რომლებსაც აქვთ url
          .sort((a, b) => {
            // დავალაგოთ createdAt ველის მიხედვით, თუ ეს ველი არსებობს
            if (a.data.createdAt && b.data.createdAt) {
              const dateA = a.data.createdAt.toDate ? a.data.createdAt.toDate() : new Date(a.data.createdAt);
              const dateB = b.data.createdAt.toDate ? b.data.createdAt.toDate() : new Date(b.data.createdAt);
              return dateB.getTime() - dateA.getTime(); // ახლიდან ძველისკენ დალაგება
            }
            return 0;
          });
        
        console.log(`Found ${sortedDocs.length} dining documents`);
        
        // ყველა url-ის დამუშავება
        const imagePromises: Promise<string | null>[] = [];
        sortedDocs.forEach(({ id, data }) => {
          imagePromises.push(getProperImageUrl(data.url));
        });
        
        // პარალელურად დავამუშავოთ ყველა URL
        if (imagePromises.length > 0) {
          const processedImages = await Promise.all(imagePromises);
          // გავფილტროთ მხოლოდ მოქმედი URL-ები (null ღირებულებები გამოვრიცხოთ)
          const validImages = processedImages.filter(url => url !== null) as string[];
          console.log(`Processed ${processedImages.length} URLs, ${validImages.length} valid images`);
          
          if (validImages.length > 0) {
            // საკმარისი სურათები გვაქვს სლაიდერისთვის
            setDiningImages(validImages);
          } else {
            console.log("No valid dining images from Firebase");
            setDiningImages([]);
          }
        } else {
          console.log("No Firebase dining images found");
          setDiningImages([]);
        }
        
        // მენიუს სურათები
        const menuDoc = await getDoc(doc(db, "sections", "diningMenu"))
        if (menuDoc.exists()) {
          if (menuDoc.data().imageUrls && Array.isArray(menuDoc.data().imageUrls)) {
            // ახალი ვერსია - მასივი
            const menuUrls: string[] = [];
            for (const url of menuDoc.data().imageUrls) {
              const processedUrl = await getProperImageUrl(url);
              if (processedUrl) menuUrls.push(processedUrl);
            }
            setMenuImages(menuUrls);
            console.log(`Loaded ${menuUrls.length} menu images from Firebase`);
          } else if (menuDoc.data().imageUrl) {
            // ძველი ვერსია - ერთი სურათი
            const menuUrl = await getProperImageUrl(menuDoc.data().imageUrl);
            if (menuUrl) {
              setMenuImage(menuUrl);
              console.log("Menu image loaded from Firebase (legacy format)");
            } else {
              console.log("Menu image URL not valid, not displaying any menu image");
            }
          }
        }
        
        setLoading(false)
      } catch (error) {
        console.error("Error fetching dining content:", error)
        setDiningImages([]); // ცარიელი მასივი შეცდომის შემთხვევაში
        setLoading(false)
      }
    }
    
    fetchContent()
    
    return () => {
      // წავშალოთ ანიმაცია, თუ კომპონენტი ანმაუნთდება
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])
  
  // ცალკე useEffect სლაიდერის ანიმაციისთვის, რომელიც გაეშვება ფოტოების ჩატვირთვის შემდეგ
  useEffect(() => {
    // ანიმაციის დაწყება მხოლოდ მაშინ, როცა ფოტოები ჩატვირთულია და loading არ არის true
    if (loading || diningImages.length === 0) {
      return
    }
    
    console.log("Starting dining slider animation with", diningImages.length, "images");
    
    // გაეშვას ცოტა დაყოვნებით, რომ DOM-ი დარენდერდეს
    const timeoutId = setTimeout(() => {
      const slider = sliderTrackRef.current;
      if (!slider || slider.children.length <= 1) {
        console.log("Slider not ready:", slider?.children.length, "children");
        return;
      }
      
      let position = 0;
      const speed = 0.5; // სიჩქარე პიქსელებში
      
      // მარტივი ანიმაციის ფუნქცია
      const animate = () => {
        position += speed;
        
        // როცა პირველი სურათი სრულად გავა ეკრანიდან, გადაიტანე ბოლოში უხილავად
        const firstChild = slider.children[0] as HTMLElement;
        const itemWidth = firstChild.offsetWidth + 5; // +5 მარჯინისთვის (გაზრდილი მარჯინის გათვალისწინება)
        
        if (position >= itemWidth) {
          // დავმალოთ გადატანის ანიმაცია - გადავიყვანოთ პოზიცია 0-ზე, გადავიტანოთ ელემენტი და შემდეგ ისევ დავაბრუნოთ CSS ტრანზიშენი
          slider.style.transition = 'none';
          slider.appendChild(firstChild);
          position = 0;
          slider.style.transform = `translateX(-${position}px)`;
          
          // ვაძალოთ რეფლოუ, რომ ცვლილებები გამოჩნდეს ტრანზიშენის დაბრუნებამდე
          slider.offsetHeight; 
          
          // დავაბრუნოთ ტრანზიშენი
          slider.style.transition = 'transform 0.1s linear';
        } else {
          slider.style.transform = `translateX(-${position}px)`;
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      // დაიწყე ანიმაცია
      animationRef.current = requestAnimationFrame(animate);
    }, 500);
    
    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [loading, diningImages]);

  // გადიდების ფუნქციონალისთვის
  const openModal = (imageUrl: string, context: 'menu' | 'dining' | 'single' = 'single', index: number = 0) => {
    setSelectedImage(imageUrl);
    setSelectedImageContext(context);
    setSelectedImageIndex(index);
    // გადიდების რესეტი ყოველი ახალი ფოტოს გახსნისას
    setZoomLevel(1);
    document.body.style.overflow = 'hidden'; // დავბლოკოთ სქროლი როცა მოდალი ღიაა
  }

  const closeModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto'; // დავაბრუნოთ სქროლი როცა მოდალს დავხურავთ
  }

  // ფოტოს გადიდების ფუნქციონალი
  const handleImageZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    
    // გამოვითვალოთ ზუსტი კლიკის პოზიცია სურათზე
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    if (zoomLevel === 1) {
      // გავადიდოთ 2.5-ჯერ
      setZoomLevel(2.5);
      setZoomPosition({ x, y });
    } else {
      // თუ უკვე გადიდებულია, გავაუქმოთ გადიდება
      setZoomLevel(1);
      setZoomPosition({ x: 0.5, y: 0.5 });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // ფუნქცია მენიუს ფოტოების სანავიგაციოდ
  const nextMenuImage = () => {
    if (menuImages.length > 0) {
      setCurrentMenuIndex((prev) => (prev + 1) % menuImages.length);
    }
  };

  const prevMenuImage = () => {
    if (menuImages.length > 0) {
      setCurrentMenuIndex((prev) => (prev - 1 + menuImages.length) % menuImages.length);
    }
  };

  // მოდალში ფოტოების ნავიგაციისთვის
  const nextModalImage = () => {
    if (selectedImageContext === 'menu') {
      const newIndex = (selectedImageIndex + 1) % menuImages.length;
      setSelectedImageIndex(newIndex);
      setSelectedImage(menuImages[newIndex]);
    } else if (selectedImageContext === 'dining') {
      const newIndex = (selectedImageIndex + 1) % diningImages.length;
      setSelectedImageIndex(newIndex);
      setSelectedImage(diningImages[newIndex]);
    }
  };

  const prevModalImage = () => {
    if (selectedImageContext === 'menu') {
      const newIndex = (selectedImageIndex - 1 + menuImages.length) % menuImages.length;
      setSelectedImageIndex(newIndex);
      setSelectedImage(menuImages[newIndex]);
    } else if (selectedImageContext === 'dining') {
      const newIndex = (selectedImageIndex - 1 + diningImages.length) % diningImages.length;
      setSelectedImageIndex(newIndex);
      setSelectedImage(diningImages[newIndex]);
    }
  };

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
              <a href="/fine-dining" className="text-sm text-orange-400">
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
                className="block py-2 text-sm text-orange-400"
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

      {/* Hero Section with Brick Background */}
      <section className="relative h-[800px] w-full">
        <div className="absolute inset-0">
          {heroImage ? (
            <Image 
              src={heroImage} 
              alt="Restaurant – Traditional Georgian Cuisine at Hotel Serodani"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="bg-gray-200 h-full w-full flex items-center justify-center text-gray-500">
              <p>Hero image not available</p>
            </div>
          )}
          <div className="absolute inset-0 bg-black/20" />
        </div>
      </section>
      
      {/* უსასრულო სლაიდერი - მთავარი გვერდის მსგავსი */}
      {diningImages.length > 0 && (
        <section className="py-8">
          <div className="w-full px-0 overflow-hidden">
            <div className="slider-container overflow-hidden w-full">
              <div ref={sliderTrackRef} className="slider-track flex">
                {loading ? (
                  <div className="hidden">
                    {/* ჩატვირთვის ანიმაცია გადატანილია ზევით */}
                  </div>
                ) : (
                  <>
                    {/* ბევრი სურათი გავამრავლოთ რომ ცარიელი ადგილები არ დარჩეს */}
                    {Array.from({ length: 3 }).flatMap((_, arrayIndex) =>
                      diningImages.map((src, i) => (
                        <div
                          key={`${arrayIndex}-${i}`}
                          className="relative flex-shrink-0 h-[280px] cursor-pointer"
                          style={{ width: "350px", marginRight: "5px" }}
                          onClick={() => openModal(src, 'dining', i)}
                        >
                          <Image
                            src={src}
                            alt={`Georgian cuisine Kakheti - Traditional food at Hotel Serodani Restaurant`}
                            fill
                            sizes="350px"
                            className="object-cover"
                            loading={arrayIndex === 0 && i < 3 ? "eager" : "lazy"}
                            onError={(e) => {
                              // მთლიანი დივის დამალვა შეცდომის შემთხვევაში
                              const parent = (e.target as HTMLElement).parentElement;
                              if (parent) parent.style.display = 'none';
                            }}
                          />
                        </div>
                      ))
                    )}
                  </>
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
                font-size: 0; /* ხსნის დივებს შორის ცარიელ ადგილებს */
                line-height: 0; /* ხსნის დივებს შორის ცარიელ ადგილებს */
              }
            `}</style>
          </div>
        </section>
      )}

      {/* Restaurant Description */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-8">RESTAURANT</h1>
            <p className="text-gray-700 leading-relaxed">
            At Hotel Serodani, our restaurant is much more than a place to eat — it's where the rich flavors and vibrant traditions of Georgian cuisine come alive.

Guided by a local chef, every dish is thoughtfully prepared using fresh, locally sourced ingredients to bring you an authentic taste of Kakheti's culinary heritage.            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
            Our restaurant has two floors and can accommodate up to 100 guests, making it ideal for romantic dinners, family gatherings, or festive celebrations. Step outside onto one of our two terraces, each offering panoramic views of Alazani Valley, and the majestic Caucasus Mountains.

</p>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Check our Menu</h2>

          {/* მენიუს სლაიდერი - მარტივი, ცენტრში და დიდი */}
          {menuImages.length > 0 ? (
            <div className="relative max-w-5xl mx-auto">
              {/* სლაიდერის მთავარი კონტეინერი */}
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentMenuIndex * 100}%)` }}
                >
                  {menuImages.map((image, index) => (
                    <div 
                      key={index} 
                      className="flex-none w-full flex justify-center items-center"
                      onClick={() => openModal(image, 'menu', index)}
                    >
                      <div className="relative h-[75vh] w-full max-w-4xl cursor-pointer">
                        <Image
                          src={image}
                          alt={`Traditional Georgian food - Restaurant menu at Hotel Serodani in Kakheti`}
                          fill
                          className="object-contain"
                          loading="lazy"
                          sizes="(max-width: 768px) 90vw, 80vw"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* სანავიგაციო ღილაკები */}
              {menuImages.length > 1 && (
                <>
                  <button 
                    onClick={prevMenuImage}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-10"
                    aria-label="Previous menu image"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                  <button 
                    onClick={nextMenuImage}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-10"
                    aria-label="Next menu image"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                </>
              )}

              {/* ინდიკატორები */}
              {menuImages.length > 1 && (
                <div className="flex justify-center space-x-2 mt-4">
                  {menuImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMenuIndex(index)}
                      className={`w-3 h-3 rounded-full ${
                        index === currentMenuIndex ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                      aria-label={`Go to menu image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : menuImage ? (
            // ძველი ვერსია - ერთი მენიუს ფოტო
            <div className="flex justify-center">
              <div 
                className="relative cursor-pointer max-w-4xl"
                onClick={() => openModal(menuImage)}
              >
                <Image
                  src={menuImage}
                  alt="Restaurant in Telavi - Georgian cuisine menu at Hotel Serodani"
                  width={1000}
                  height={1400}
                  className="object-contain mx-auto"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>
      
      {/* Modal for full-screen image */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div 
            ref={imageContainerRef}
            className={`relative w-[90vw] h-[90vh] max-w-7xl overflow-hidden ${zoomLevel > 1 ? '' : 'cursor-zoom-in'}`}
            onClick={(e) => {
              // მხოლოდ მაშინ დავხუროთ მოდალი, თუ გარე კონტეინერზე დავაჭირეთ
              e.stopPropagation();
              handleImageZoom(e);
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                transform: `scale(${zoomLevel})`,
                transformOrigin: `${zoomPosition.x * 100}% ${zoomPosition.y * 100}%`,
                transition: 'transform 0.2s ease-out'
              }}
            >
              <Image
                src={selectedImage}
                alt="Full view image"
                fill
                className="object-contain select-none"
                sizes="90vw"
                priority={true}
                quality={90}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  closeModal();
                }}
              />
            </div>
            
            {/* მოდალის ნავიგაციის ღილაკები */}
            {selectedImageContext !== 'single' && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    prevModalImage();
                    // გავაუქმოთ ზუმი ფოტოს ცვლილებისას
                    setZoomLevel(1);
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    nextModalImage();
                    // გავაუქმოთ ზუმი ფოტოს ცვლილებისას
                    setZoomLevel(1);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
            
            <button
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
              onClick={(e) => {
                e.stopPropagation();
                closeModal();
              }}
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* ფოტოს ინდექსი/სულ */}
            {selectedImageContext === 'menu' && menuImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white py-1 px-3 rounded-full">
                {selectedImageIndex + 1} / {menuImages.length}
              </div>
            )}
            {selectedImageContext === 'dining' && diningImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white py-1 px-3 rounded-full">
                {selectedImageIndex + 1} / {diningImages.length}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Footer */}
      <Footer />
    </div>
  )
}
