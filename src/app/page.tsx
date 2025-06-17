"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Phone, Mail, ChevronLeft, ChevronRight, Star, User, Menu, X, Settings } from "lucide-react"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import { getStorage, ref, listAll, getDownloadURL, getMetadata } from "firebase/storage"
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
  const [visibleSections, setVisibleSections] = useState<string[]>([])
  const { user, signOut, isAdmin } = useAuth()
  const sliderTrackRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const galleryRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // გავასუფთავოთ ბრაუზერის ქეში სურათებიდან
    if (typeof window !== 'undefined') {
      // ლოკალური სურათების ქეშის წასაშლელი ფუნქცია
      const clearImageCache = () => {
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              caches.delete(cacheName);
              console.log("Deleted cache:", cacheName);
            });
          });
        }

        // ასევე შეგვიძლია ლოკალ სტორეჯში დავინახოთ რომ ქეში გავსუფთავეთ
        localStorage.setItem("cacheCleared", new Date().toISOString());
        console.log("Browser cache clear attempted");
      };

      clearImageCache();
    }

    const fetchContent = async () => {
      // პირველ რიგში დავაყენოთ ფოლბექი სლაიდერისთვის, რომ არ დაგვჭირდეს ლოდინი
      setSliderImages([
        '/slider/1.jpg',
        '/slider/2.jpg',
        '/slider/3.jpg',
        '/slider/4.jpg',
        '/slider/5.jpg',
        '/slider/6.jpg',
        '/slider/7.jpg',
      ]);
      
      try {
        // მთავარი ჰერო სურათის წამოღება Firebase-დან
        const heroDoc = await getDoc(doc(db, "sections", "hero"))
        if (heroDoc.exists() && heroDoc.data().imageUrl) {
          setHeroImage(heroDoc.data().imageUrl)
          console.log("Hero image loaded from Firebase:", heroDoc.data().imageUrl)
        } else {
          console.log("Hero image document not found or no imageUrl")
        }

        // სლაიდერის სურათების წამოღება Firebase Storage-დან /slider ფოლდერიდან
        try {
          const sliderRef = ref(storage, '/slider');
          const sliderResult = await listAll(sliderRef);
          
          const sliderImagePromises = sliderResult.items.map(async (imageRef) => {
            try {
              const url = await getDownloadURL(imageRef);
              return url;
            } catch (error) {
              console.error("Error getting slider image URL:", error);
              return null;
            }
          });
          
          const sliderImageUrls = (await Promise.all(sliderImagePromises)).filter(url => url !== null) as string[];
          
          if (sliderImageUrls.length > 0) {
            setSliderImages(sliderImageUrls);
            console.log("Slider images loaded from Firebase Storage:", sliderImageUrls.length);
          }
        } catch (error) {
          console.error("Error fetching slider images from Firebase Storage:", error);
          // ფოლბეკი უკვე დაყენებულია, ამიტომ აქ არაფერი არ გვჭირდება
        }

        // სთორის სურათების წამოღება Firebase-დან
        const storyDoc = await getDoc(doc(db, "sections", "story"))
        if (storyDoc.exists() && storyDoc.data().imageUrls) {
          setStoryImages(storyDoc.data().imageUrls)
          console.log("Story images loaded from Firebase:", storyDoc.data().imageUrls)
        } else {
          console.log("Story document not found or no imageUrls")
        }

        // დიდი სურათის წამოღება Firebase-დან
        const largePhotoDoc = await getDoc(doc(db, "sections", "largePhoto"))
        if (largePhotoDoc.exists() && largePhotoDoc.data().imageUrl) {
          setLargePhoto(largePhotoDoc.data().imageUrl)
          console.log("Large photo loaded from Firebase:", largePhotoDoc.data().imageUrl)
        } else {
          console.log("Large photo document not found or no imageUrl")
        }

        // გესთის რევიუს სურათის წამოღება Firebase-დან
        const guestReviewDoc = await getDoc(doc(db, "sections", "guestReview"))
        if (guestReviewDoc.exists() && guestReviewDoc.data().imageUrl) {
          setGuestReviewImage(guestReviewDoc.data().imageUrl)
          console.log("Guest review image loaded from Firebase:", guestReviewDoc.data().imageUrl)
        } else {
          console.log("Guest review document not found or no imageUrl")
        }
        
        // გალერიის სურათების წამოღება Firebase Storage-დან /gallery ფოლდერიდან
        try {
          console.log("Fetching gallery images from Firebase Storage '/gallery' folder...");
          const galleryRef = ref(storage, '/gallery');
          const galleryResult = await listAll(galleryRef);
          
          if (galleryResult.items.length > 0) {
            // შევაგროვოთ ყველა ფაილის მეტადატა და URL ერთდროულად
            const galleryImagesWithMetadata = await Promise.all(
              // მხოლოდ პირველი 3 სურათის სრულად წამოღება, დანარჩენისთვის მხოლოდ მეტადატა
              galleryResult.items.map(async (imageRef, index) => {
                try {
                  // მხოლოდ პირველი 3 სურათისთვის გამოვითხოვოთ URL-ები წინასწარ
                  const url = index < 3 ? await getDownloadURL(imageRef) : null;
                  const metadata = await getMetadata(imageRef);
                  return {
                    ref: imageRef, // შევინახოთ reference მომავალი გამოყენებისთვის
                    url: url,
                    timeCreated: metadata.timeCreated ? new Date(metadata.timeCreated) : new Date(),
                    name: imageRef.name,
                    index: index
                  };
                } catch (error) {
                  console.error(`Error processing gallery image ${imageRef.name}:`, error);
                  return null;
                }
              })
            );
            
            // გავფილტროთ null მნიშვნელობები და დავალაგოთ თარიღის მიხედვით (ახლიდან ძველისკენ)
            const sortedGalleryImagesMetadata = galleryImagesWithMetadata
              .filter(item => item !== null)
              .sort((a, b) => {
                if (!a || !b) return 0;
                return b.timeCreated.getTime() - a.timeCreated.getTime();
              });
            
            // მხოლოდ პირველი 3 სურათის URL-ები
            const initialGalleryImages = sortedGalleryImagesMetadata
              .slice(0, 3)
              .map(item => item!.url || '/placeholder.svg?height=300&width=400&text=Loading...'); // პლეისჰოლდერი თუ URL ჯერ არ არის წამოღებული
            
            if (initialGalleryImages.length > 0) {
              setGalleryImages(initialGalleryImages);
              console.log("Initial gallery images loaded:", initialGalleryImages.length);
              
              // დანარჩენი სურათების წამოღება ფონურად
              setTimeout(() => {
                Promise.all(
                  sortedGalleryImagesMetadata.slice(3).map(async (item) => {
                    if (!item) return '/placeholder.svg?height=300&width=400&text=Loading...';
                    if (item.url) return item.url;
                    try {
                      return await getDownloadURL(item.ref);
                    } catch (error) {
                      console.error(`Error loading deferred image ${item.name}:`, error);
                      return '/placeholder.svg?height=300&width=400&text=Loading...';
                    }
                  })
                ).then(deferredUrls => {
                  // გავაერთიანოთ საწყისი და მოგვიანებით ჩატვირთული URL-ები
                  const allUrls = [...initialGalleryImages, ...deferredUrls];
                  setGalleryImages(allUrls);
                  console.log("All gallery images loaded:", allUrls.length);
                });
              }, 2000); // 2 წამის დაყოვნებით დავიწყოთ დანარჩენი სურათების ჩატვირთვა
            } else {
              console.log("No valid gallery images found in Firebase Storage, using fallback local images");
              // ფოლბექი ლოკალური სურათებისთვის
              const localGalleryImages = Array.from({ length: 23 }, (_, i) => `/${i + 1}.jpg`);
              localGalleryImages[1] = '/2.png';
              setGalleryImages(localGalleryImages);
            }
          } else {
            console.log("No gallery images found in Firebase Storage, using fallback local images");
            // ფოლბექი ლოკალური სურათებისთვის
            const localGalleryImages = Array.from({ length: 23 }, (_, i) => `/${i + 1}.jpg`);
            localGalleryImages[1] = '/2.png';
            setGalleryImages(localGalleryImages);
          }
        } catch (error) {
          console.error("Error fetching gallery images from Firebase Storage:", error);
          // ფოლბექი ლოკალური სურათებისთვის შეცდომის შემთხვევაში
          const localGalleryImages = Array.from({ length: 23 }, (_, i) => `/${i + 1}.jpg`);
          localGalleryImages[1] = '/2.png';
          setGalleryImages(localGalleryImages);
        }
        
        setLoading(false)
      } catch (error) {
        console.error("Error fetching content:", error)
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
    // ანიმაციის დაწყება მხოლოდ მაშინ, როცა ფოტოები ჩატვირთულია და sliderImages არ არის ცარიელი
    if (sliderImages.length === 0) {
      return
    }
    
    console.log("Starting slider animation with", sliderImages.length, "images");
    
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
        if (!firstChild) return; // დავრწმუნდეთ რომ firstChild არსებობს
        
        const itemWidth = firstChild.offsetWidth + 10; // +10 მარჯინისთვის
        
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
    }, 500); // დავაბრუნოთ საწყისი დაყოვნება
    
    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [sliderImages, loading]); // დავამატოთ loading უკან დამოკიდებულებებში

  const nextGalleryImage = () => {
    setCurrentGalleryIndex((prev) => {
      const maxSlides = Math.ceil((galleryImages.length > 0 ? galleryImages.length : placeholderGalleryImages.length) / 3)
      return prev < maxSlides - 1 ? prev + 1 : prev
    })
    
    // ახალი სლაიდის ჩატვირთვა, როცა მომხმარებელი გადაფურცლავს
    const newIndex = currentGalleryIndex + 1;
    if (newIndex * 3 + 3 <= galleryImages.length) {
      // უკვე ჩატვირთულია ყველა საჭირო სურათი
      return;
    }
    
    console.log("Loading more gallery images for slide:", newIndex);
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

  // Placeholder images for when Firebase images aren't loaded yet
  const placeholderSliderImages = [
    "/placeholder.svg?height=200&width=400&text=Slider+1",
    "/placeholder.svg?height=200&width=400&text=Slider+2",
    "/placeholder.svg?height=200&width=400&text=Slider+3",
    "/placeholder.svg?height=200&width=400&text=Slider+4",
    "/placeholder.svg?height=200&width=400&text=Slider+5",
  ]

  const placeholderStoryImages = [
    "/placeholder.svg?height=240&width=320&text=Story+1"
  ]

  const placeholderLargePhoto = "/placeholder.svg?height=400&width=1200&text=Large+Photo"

  const placeholderGalleryImages = [
    "/placeholder.svg?height=320&width=400&text=Gallery+1",
    "/placeholder.svg?height=320&width=400&text=Gallery+2",
    "/placeholder.svg?height=320&width=400&text=Gallery+3",
  ]

  const placeholderGuestReviewImage = "/placeholder.svg?height=500&width=500&text=Guest+Review"

  // IntersectionObserver-ის გამოყენება სექციების ხილვადობის დასადგენად
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleSections(prev => {
            if (!prev.includes(entry.target.id)) {
              console.log(`Section ${entry.target.id} is now visible`);
              return [...prev, entry.target.id];
            }
            return prev;
          });
        }
      });
    }, observerOptions);
    
    // დავაკვირდეთ სექციებს
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
      sectionObserver.observe(section);
    });
    
    return () => {
      sections.forEach(section => {
        sectionObserver.unobserve(section);
      });
    };
  }, []);
  
  // გალერიის სურათების ლეივი ჩატვირთვა, როცა გალერიის სექცია ხილვადი გახდება
  useEffect(() => {
    if (visibleSections.includes('gallery') && galleryImages.length <= 3) {
      console.log('Gallery section is visible, loading more images');
      // აქ შეგვიძლია დავიწყოთ დანარჩენი სურათების ჩატვირთვა
    }
  }, [visibleSections, galleryImages.length]);

  return (
    <div className="relative min-h-screen">
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
              {/* Admin Panel Link for Mobile */}
              {user && isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center py-2 text-sm text-orange-400 hover:text-orange-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
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
            src={heroImage && heroImage.trim() ? heroImage : "/home/gallery (15).jpg"} 
            alt="Hotel in Kakheti - Serodani Boutique Wooden Cottages" 
            width={1200} 
            height={800} 
            priority 
            unoptimized
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center h-full">
          <div className="text-center text-white px-4">
            <div className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">Hotel Serodani
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl tracking-widest font-light" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Wooden Cottages in the heart of Kaketi, Georgia</div>
          </div>
        </div>
        
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap');
        `}</style>
      </section>

      {/* Tagline Section */}
      <section className="py-16 bg-[#242323] text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-wide text-white">Hidden Paradise in Telavi</h1>
     
        {/* ჩატვირთვის ანიმაცია ტექსტის ქვემოთ */}
        {loading && (
          <div className="flex justify-center items-center mt-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-400"></div>
          </div>
        )}
      </section>

      {/* Image Gallery Preview - უსასრულო სლაიდერი */}
      <section className="py-8 bg-[#242323]">
        <div className="w-full px-0 overflow-hidden">
          <div className="slider-container overflow-hidden w-full">
            <div ref={sliderTrackRef} className="slider-track flex">
              {loading ? (
                <div className="hidden">
                  {/* ჩატვირთვის ანიმაცია გადატანილია ზევით */}
                </div>
              ) : (
                <>
                  {sliderImages.length > 0 ? (
                    // ყველა სურათი ორჯერ, რომ უსასრულოდ მოძრაობდეს
                    [...sliderImages, ...sliderImages].map((src, i) => {
                      // დავრწმუნდეთ რომ src არ არის ცარიელი სტრინგი
                      const imageSrc = src && src.trim() ? src : '/placeholder.svg?height=280&width=350&text=Loading...';
                      
                      return (
                        <div
                          key={i}
                          className="relative flex-shrink-0 h-[280px]"
                          style={{ width: "350px", marginRight: "10px" }}
                        >
                          <Image
                            src={imageSrc}
                            alt={`Boutique hotel in Kakheti - Wooden cottages in Georgia`}
                            width={350}
                            height={280}
                            className="object-cover"
                            loading={i < 6 ? "eager" : "lazy"}
                            priority={i < 3}
                            unoptimized={i < 3}
                          />
                        </div>
                      );
                    })
                  ) : (
                    // ფოლბექ იმიჯები თუ სერვერიდან არ მოვიდა
                    ['/slider/1.jpg', '/slider/2.jpg', '/slider/3.jpg', '/slider/4.jpg', '/slider/5.jpg'].map((src, i) => {
                      // დავრწმუნდეთ რომ src არ არის ცარიელი სტრინგი
                      const imageSrc = src && src.trim() ? src : '/placeholder.svg?height=280&width=350&text=Loading...';
                      
                      return (
                        <div
                          key={i}
                          className="relative flex-shrink-0 h-[280px]"
                          style={{ width: "350px", marginRight: "10px" }}
                        >
                          <Image
                            src={imageSrc}
                            alt={`Best hotels in Kakheti - Serodani wooden cottages`}
                            width={350}
                            height={280}
                            className="object-cover"
                            loading={i < 3 ? "eager" : "lazy"}
                            priority={i < 3}
                            unoptimized={i < 3}
                          />
                        </div>
                      );
                    })
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
            }
          `}</style>
        </div>
      </section>

      {/* Our Story - Simplified with 3 photos */}
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
              We offer 6 uniquely designed wooden cottages, Each one designed for comfort and privacy, ideal for romantic getaways, family trips, or a peaceful weekend with friends. Each cottage belongs to a different category and is fully equipped with all the necessary modern amenities to ensure your comfort and relaxation. Surrounded by gardens, mountain views, and fresh air—you'll feel at home the moment you arrive.
            </p>
            <p>
              <strong className="text-2xl">Food & Wine</strong><br />
              Our on-site restaurant serves traditional Georgian cuisine made with fresh, local ingredients. We also produce a variety of Georgian wines, aged in our own cellar. Guests are welcome to join wine tastings and learn the stories behind each bottle. With two bars—indoor and outdoor—you'll always find a perfect spot.
            </p>
            <p>
              Hotel Serodani is only 2 kms away from Telavi. Tbilisi Airport is 62 km away. (1.5 hour). There is a bus stop next to the hotel.
            </p>
          </div>

          {/* Story Images - გაფართოებული კონტეინერი პანორამული ფოტოებისთვის */}
          <div className="w-full overflow-hidden mb-20">
            <div className="w-full max-w-7xl mx-auto">
              {storyImages.length > 0 ? (
                // მხოლოდ პირველი ფოტო გამოვაჩინოთ, თუ ის არსებობს
                <div 
                  className="relative w-full mb-0"
                  style={{ 
                    paddingTop: `${(1365 / 5005) * 100}%` /* პროპორციის შენარჩუნება: 5005:1365 */ 
                  }}
                >
                  <Image
                    src={storyImages[0] && storyImages[0].trim() ? storyImages[0] : '/placeholder.svg?height=1365&width=5005&text=Story+Image'}
                    alt="Nature hotel in Georgia - Georgian countryside hotel"
                    width={1200}
                    height={1365}
                    className="object-contain"
                    loading="lazy"
                    sizes="(max-width: 768px) 90vw, 1200px"
                  />
                </div>
              ) : (
                // ფოლბეკ ფოტო, თუ ფოტო არ არის
                <div 
                  className="relative w-full mb-0"
                  style={{ 
                    paddingTop: `${(1365 / 5005) * 100}%` /* პროპორციის შენარჩუნება: 5005:1365 */ 
                  }}
                >
                  <Image
                    src={placeholderStoryImages[0] && placeholderStoryImages[0].trim() ? placeholderStoryImages[0] : '/placeholder.svg?height=1365&width=5005&text=Story+Image'}
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

          <div className="max-w-4xl mx-auto space-y-6 text-gray-300 leading-relaxed">
            <h2 className="text-3xl font-bold mb-8 text-center text-white">ACTIVITIES</h2>
            <p>
              <strong>Outdoor swimming pools</strong><br />
              Swim in our swimming pools with stunning views of the Alazani Valley and the Caucasus Mountains.
            </p>
            <p>
              <strong>Culinary Masterclasses</strong><br />
              We offer a truly authentic experience through Georgian cooking masterclasses. Make Your Own Khinkali – Learn to prepare and shape Georgia's beloved dumplings by hand, guided by local cooks.
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
      <section id="gallery" ref={galleryRef} className="py-20 bg-[#242323]">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-white">GALLERY</h2>
          <div className="relative max-w-5xl mx-auto">
            <div className="overflow-hidden rounded-lg">
              <div className="flex transition-transform duration-500 ease-in-out"
                   style={{ transform: `translateX(-${currentGalleryIndex * 100}%)` }}>
                {/* First slide - პრიორიტეტული ჩატვირთვა */}
                <div className="flex-none w-full">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {galleryImages.slice(0, 3).map((src, i) => {
                      // დავრწმუნდეთ რომ src არ არის ცარიელი სტრინგი
                      const imageSrc = src && src.trim() ? src : '/placeholder.svg?height=300&width=400&text=Loading...';
                      
                      return (
                        <div key={i} className="relative h-[300px] rounded-lg overflow-hidden shadow-lg">
                          <Image
                            src={imageSrc}
                            alt={`Cottage stay in Kakheti - Gallery of Hotel Serodani`}
                            width={400}
                            height={300}
                            className="object-cover"
                            priority={true}
                            loading="eager"
                            unoptimized={true}
                            onError={(e) => {
                              // მთლიანი კონტეინერის დამალვა შეცდომის შემთხვევაში
                              const parent = (e.target as HTMLElement).parentElement;
                              if (parent) parent.style.display = 'none';
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* მეორე და შემდგომი სლაიდები - მხოლოდ ხილული სლაიდების რენდერი */}
                {Array.from({ length: Math.ceil(galleryImages.length / 3) - 1 }).map((_, slideIndex) => {
                  const startIdx = (slideIndex + 1) * 3;
                  const endIdx = startIdx + 3;
                  const isVisible = slideIndex === currentGalleryIndex - 1 || 
                                   slideIndex === currentGalleryIndex ||
                                   slideIndex === currentGalleryIndex + 1;
                  
                  // თუ სლაიდი არ არის ხილული ან მისი მეზობელი, არ გამოვაჩინოთ
                  if (!isVisible) {
                    return <div key={slideIndex} className="flex-none w-full"></div>;
                  }
                  
                  return (
                    <div key={slideIndex} className="flex-none w-full">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {galleryImages.slice(startIdx, endIdx).map((src, i) => {
                          // დავრწმუნდეთ რომ src არ არის ცარიელი სტრინგი
                          const imageSrc = src && src.trim() ? src : '/placeholder.svg?height=300&width=400&text=Loading...';
                          
                          return (
                            <div key={i} className="relative h-[300px] rounded-lg overflow-hidden shadow-lg">
                              <Image
                                src={imageSrc}
                                alt={`Cottage stay in Kakheti - Gallery of Hotel Serodani`}
                                width={400}
                                height={300}
                                className="object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  // მთლიანი კონტეინერის დამალვა შეცდომის შემთხვევაში
                                  const parent = (e.target as HTMLElement).parentElement;
                                  if (parent) parent.style.display = 'none';
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
              src={guestReviewImage && guestReviewImage.trim() ? guestReviewImage : placeholderGuestReviewImage}
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
