"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Phone, Mail, ChevronLeft, ChevronRight, Star, User, Menu, X, Settings } from "lucide-react"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { db, storage, rtdb } from "@/lib/firebase"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage"
import { ref as rtdbRef, get } from "firebase/database"
import { Footer } from "@/components/Footer"

export default function KviriaHotel() {
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0)
  const [heroImage, setHeroImage] = useState("")
  const [sliderImages, setSliderImages] = useState<string[]>([])
  const [storyImages, setStoryImages] = useState<string[]>([])
  const [largePhoto, setLargePhoto] = useState("")
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [galleryFailedUrls, setGalleryFailedUrls] = useState<Set<string>>(new Set())
  const [guestReviewImage, setGuestReviewImage] = useState("")
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, signOut, isAdmin } = useAuth()
  const sliderTrackRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    // გავასუფთავოთ ბრაუზერის ქეში სურათებიდან
    if (typeof window !== 'undefined') {
      // ლოკალური სურათების ქეშის წასაშლელი ფუნქცია
      const clearImageCache = () => {
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              caches.delete(cacheName);
            });
          });
        }

        // ასევე შეგვიძლია ლოკალ სტორეჯში დავინახოთ რომ ქეში გავსუფთავეთ
        localStorage.setItem("cacheCleared", new Date().toISOString());
      };

      clearImageCache();
    }

    // Helper function to get download URL with retry logic for 500 errors
    const getDownloadURLWithRetry = async (imageRef: any, maxRetries = 2): Promise<string | null> => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await getDownloadURL(imageRef);
        } catch (error: any) {
          // Check if it's a 500 error (could be in different formats)
          const is500Error = 
            error?.code === 'storage/unknown' || 
            error?.serverResponse?.status === 500 ||
            error?.message?.includes('500') ||
            (error?.code && error.code.includes('500'));
          
          // If it's a 500 error and we have retries left, wait and retry
          if (is500Error && attempt < maxRetries) {
            // Wait before retry (exponential backoff: 100ms, 200ms)
            await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
            continue;
          }
          // For other errors or if retries exhausted, return null
          return null;
        }
      }
      return null;
    };

    const fetchContent = async () => {
      // დავაყენოთ ცარიელი array, რომ არ იყოს 404 შეცდომები
      setSliderImages([]);
      
      try {
        // ჯერ შევამოწმოთ Realtime Database-ში არის თუ არა ფოტოები (უფრო სწრაფი)
        let imagesFromRealtime: any = null;
        try {
          const imagesRef = rtdbRef(rtdb, 'images');
          const snapshot = await get(imagesRef);
          if (snapshot.exists()) {
            imagesFromRealtime = snapshot.val();
          }
        } catch (rtdbError) {
          // Realtime Database-ში არ არის, გავაგრძელოთ Firestore-თან
        }

        // თუ Realtime Database-ში არის, გამოვიყენოთ ის (უფრო სწრაფი)
        if (imagesFromRealtime && imagesFromRealtime.syncedAt) {
          // 1. Hero Image
          if (imagesFromRealtime.hero) {
            setHeroImage(imagesFromRealtime.hero);
          }

          // 2. Slider Images
          if (imagesFromRealtime.slider && imagesFromRealtime.slider.length > 0) {
            setSliderImages(imagesFromRealtime.slider);
          }

          // 3. Story Images
          if (imagesFromRealtime.story && imagesFromRealtime.story.length > 0) {
            setStoryImages(imagesFromRealtime.story);
          }

          // 4. Large Photo
          if (imagesFromRealtime.largePhoto) {
            setLargePhoto(imagesFromRealtime.largePhoto);
          }

          // 5. Guest Review
          if (imagesFromRealtime.guestReview) {
            setGuestReviewImage(imagesFromRealtime.guestReview);
          }

          // 6. Gallery Images — Realtime DB ინახავს მასივს ობიექტად (0,1,2...), ნორმალიზაცია + მხოლოდ ვალიდური URL-ები
          const rawGallery = imagesFromRealtime.gallery;
          if (rawGallery && typeof rawGallery === 'object') {
            const galleryArray = Array.isArray(rawGallery) ? rawGallery : Object.values(rawGallery);
            const galleryUrls = galleryArray
              .map((item: any) => (item && item.url) || '')
              .filter((url: string) => typeof url === 'string' && url.trim() !== '' && !url.includes('placeholder'));
            if (galleryUrls.length > 0) {
              setGalleryImages(galleryUrls);
            }
          }

          setLoading(false);
          return; // Realtime Database-დან ჩატვირთულია, აღარ გვჭირდება Firestore
        }

        // თუ Realtime Database-ში არ არის, გავაგრძელოთ Firestore-თან (ძველი ლოგიკა)
        // 1. პირველ რიგში - მთავარი ჰერო სურათი (ყველაზე მნიშვნელოვანი)
        const heroDoc = await getDoc(doc(db, "sections", "hero"));
        if (heroDoc.exists() && heroDoc.data().imageUrl) {
          setHeroImage(heroDoc.data().imageUrl);
        }

        // 2. მეორე რიგში - სლაიდერის სურათები (მნიშვნელოვანი, მაგრამ ფოლბექი უკვე არის)
        // დავიწყოთ დაუყოვნებლივ, როგორც კი ჰერო სურათი დაყენდება
        const loadSliderImages = async () => {
          try {
            const sliderRef = ref(storage, '/slider');
            const sliderResult = await listAll(sliderRef);
          
          if (sliderResult.items.length > 0) {
            // პირველი 7 სურათი დაუყოვნებლივ
            const initialSliderBatch = sliderResult.items.slice(0, 7);
            const remainingSliderItems = sliderResult.items.slice(7);
            
            const sliderImagePromises = initialSliderBatch.map(async (imageRef) => {
              return await getDownloadURLWithRetry(imageRef);
            });
            
            const sliderImageUrls = (await Promise.all(sliderImagePromises)).filter(url => url !== null) as string[];
            
            if (sliderImageUrls.length > 0) {
              setSliderImages(sliderImageUrls);
              
              // დანარჩენი სლაიდერის სურათების lazy loading (ფონურად)
              if (remainingSliderItems.length > 0) {
                setTimeout(async () => {
                  try {
                    const remainingSliderUrls = await Promise.all(
                      remainingSliderItems.map(async (imageRef) => {
                        return await getDownloadURLWithRetry(imageRef);
                      })
                    );
                    
                    const validRemainingUrls = remainingSliderUrls.filter(url => url !== null) as string[];
                    if (validRemainingUrls.length > 0) {
                      setSliderImages(prev => [...prev, ...validRemainingUrls]);
                    }
                  } catch (error) {
                    // Silent error handling
                  }
                }, 2000);
              }
            }
          }
        } catch (error) {
            // ფოლბეკი უკვე დაყენებულია, ამიტომ აქ არაფერი არ გვჭირდება
          }
        };
        
        // დავიწყოთ სლაიდერის სურათების ჩატვირთვა დაუყოვნებლივ (არ ველოდებით სხვა ოპერაციებს)
        loadSliderImages();

        // 3. მესამე რიგში - სხვა სექციები (story, largePhoto, guestReview) - პარალელურად
        const [storyDoc, largePhotoDoc, guestReviewDoc] = await Promise.all([
          getDoc(doc(db, "sections", "story")),
          getDoc(doc(db, "sections", "largePhoto")),
          getDoc(doc(db, "sections", "guestReview"))
        ]);

        // სთორის სურათების წამოღება Firebase-დან
        if (storyDoc.exists() && storyDoc.data().imageUrls) {
          setStoryImages(storyDoc.data().imageUrls);
        }

        // დიდი სურათის წამოღება Firebase-დან
        if (largePhotoDoc.exists() && largePhotoDoc.data().imageUrl) {
          setLargePhoto(largePhotoDoc.data().imageUrl);
        }

        // გესთის რევიუს სურათის წამოღება Firebase-დან
        if (guestReviewDoc.exists() && guestReviewDoc.data().imageUrl) {
          setGuestReviewImage(guestReviewDoc.data().imageUrl);
        }

        // 4. ბოლოს - გალერიის სურათები (ყველაზე ნელი, მაგრამ ნაკლებად კრიტიკული)
        try {
          const gallerySnapshot = await getDocs(collection(db, 'gallery'));
          
          if (gallerySnapshot.docs.length > 0) {
            // Firestore-დან მიღებული სურათები - უკვე დალაგებული და სწრაფი
            const galleryImagesFromFirestore = gallerySnapshot.docs
              .map(doc => {
                const data = doc.data();
                return {
                  url: data.url || '',
                  createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                  position: data.position || 0
                };
              })
              .filter(item => item.url !== '')
              .sort((a, b) => {
                // ჯერ position-ით, შემდეგ createdAt-ით
                if (a.position !== b.position) {
                  return a.position - b.position;
                }
                return b.createdAt.getTime() - a.createdAt.getTime();
              })
              .map(item => item.url)
              .filter((url: string) => typeof url === 'string' && url.trim() !== '' && !url.includes('placeholder'));
            
            if (galleryImagesFromFirestore.length > 0) {
              setGalleryImages(galleryImagesFromFirestore);
            } else {
              // თუ Firestore-ში URL-ები არ არის, გადავიდეთ Storage-ზე
              throw new Error("No URLs in Firestore, falling back to Storage");
            }
          } else {
            // თუ Firestore-ში არაფერია, გადავიდეთ Storage-ზე
            throw new Error("No documents in Firestore, falling back to Storage");
          }
        } catch (firestoreError) {
          // Fallback: Firebase Storage-დან, მაგრამ ოპტიმიზებული - მხოლოდ URL-ები, მეტადატის გარეშე
          try {
            const galleryRef = ref(storage, '/gallery');
            const galleryResult = await listAll(galleryRef);
            
            if (galleryResult.items.length > 0) {
              // ოპტიმიზაცია: მხოლოდ URL-ების მიღება, მეტადატის გარეშე (2x ნაკლები მოთხოვნა)
              // და ბეტჩებად - პირველი 15 სურათი დაუყოვნებლივ, დანარჩენი lazy
              const initialBatch = galleryResult.items.slice(0, 15);
              const remainingItems = galleryResult.items.slice(15);
              
              // პირველი ბეტჩი - დაუყოვნებლივ
              const initialUrls = await Promise.all(
                initialBatch.map(async (imageRef) => {
                  return await getDownloadURLWithRetry(imageRef);
                })
              );
              
              const validInitialUrls = (initialUrls.filter(url => url !== null) as string[])
                .filter((url: string) => typeof url === 'string' && url.trim() !== '' && !url.includes('placeholder'));
              
              if (validInitialUrls.length > 0) {
                setGalleryImages(validInitialUrls);
                
                // დანარჩენი სურათების lazy loading - ფონურად
                if (remainingItems.length > 0) {
                  setTimeout(async () => {
                    try {
                      const remainingUrls = await Promise.all(
                        remainingItems.map(async (imageRef) => {
                          return await getDownloadURLWithRetry(imageRef);
                        })
                      );
                      
                      const validRemainingUrls = (remainingUrls.filter(url => url !== null) as string[])
                        .filter((url: string) => typeof url === 'string' && url.trim() !== '' && !url.includes('placeholder'));
                      if (validRemainingUrls.length > 0) {
                        setGalleryImages(prev => [...prev, ...validRemainingUrls]);
                      }
                    } catch (error) {
                      // Silent error handling
                    }
                  }, 1000); // 1 წამის შემდეგ დანარჩენი სურათების ჩატვირთვა
                }
              } else {
                throw new Error("No valid URLs from Storage");
              }
            } else {
              throw new Error("No items in Storage");
            }
          } catch (storageError) {
            // ფოლბექი ლოკალური სურათებისთვის
            const localGalleryImages = Array.from({ length: 23 }, (_, i) => `/${i + 1}.jpg`);
            localGalleryImages[1] = '/2.png';
            setGalleryImages(localGalleryImages);
          }
        }
        
        setLoading(false);
      } catch (error) {
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
    
    // გაეშვას ცოტა დაყოვნებით, რომ DOM-ი დარენდერდეს
    const timeoutId = setTimeout(() => {
      const slider = sliderTrackRef.current;
      if (!slider || slider.children.length <= 1) {
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

  const [isMobile, setIsMobile] = useState(false)

  // მთავარი ფოტოს პრელოდი — ბრაუზერი ქეშირებს, ჩატვირთვა უფრო სწრაფია
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

  // მხოლოდ ვალიდური სურათები + ლიმიტი მთავარ გვერდზე — რათა წერტილები არ იყოს ძალიან ბევრი
  const MAX_GALLERY_ON_HOME = 16 // მაქს 4 სლაიდი დესკტოპზე, 12 მობილურზე — წერტილები არ იყოს ზედმეტი
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

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      // Silent error handling
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

      {/* Hero Section — პლეისჰოლდერი არ ჩანს; სურათი მხოლოდ როცა URL ჩატვირთულია, ქეშირება/პრიორიტეტი */}
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
     
        {/* ჩატვირთვის ანიმაცია ტექსტის ქვემოთ */}
        {loading && (
          <div className="flex justify-center items-center mt-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-400"></div>
          </div>
        )}
      </section>

      {/* Image Gallery Preview - უსასრულო სლაიდერი; ცარიელი სექცია არ ჩანს */}
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
          <div className="w-full overflow-hidden mb-12">
            <div className="w-full max-w-7xl mx-auto">
              {storyImages.length > 0 ? (
                // მხოლოდ პირველი ფოტო გამოვაჩინოთ, თუ ის არსებობს
                <div 
                  className="relative w-full mb-0"
                  style={{ 
                    paddingTop: `${(100 / 5005) * 100}%` /* პროპორციის შენარჩუნება: 5005:1365 */ 
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
                // ფოლბეკ ფოტო, თუ ფოტო არ არის
                <div 
                  className="relative w-full mb-0"
                  style={{ 
                    paddingTop: `${(1365 / 5005) * 100}%` /* პროპორციის შენარჩუნება: 5005:1365 */ 
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
      <section id="gallery" className="py-12 bg-[#242323]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-8 text-white">GALLERY</h2>
          
          {displayGalleryImages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-400">გალერიის ფოტოები ჯერ არ არის ხელმისაწვდომი.</p>
            </div>
          ) : (
            <>
              {/* Gallery Container with Navigation — წერტილები და სლაიდები მხოლოდ displayGalleryImages-ის მიხედვით */}
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
              
              {/* წერტილები — მხოლოდ იმდენი, რამდენი სლაიდიც არსებობს */}
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

      {/* Guest Review Photo — რესპონსიული სიმაღლე, ცარიელი ბლოკის შემცირება */}
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

