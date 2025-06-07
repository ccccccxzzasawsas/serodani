"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth"
import { User } from "lucide-react"
import Link from "next/link"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Room } from "@/types"
import { Footer } from "@/components/Footer"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export default function RoomsPage() {
  const { user, signOut } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [heroImageUrl, setHeroImageUrl] = useState<string>("/room/hero.jpg") // ნაგულისხმევი სურათი
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  
  useEffect(() => {
    fetchRooms()
    fetchHeroImage()
  }, [])

  const fetchHeroImage = async () => {
    try {
      const docRef = doc(db, "sections", "roomsHero")
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.imageUrl) {
          setHeroImageUrl(data.imageUrl)
        }
      }
    } catch (error) {
      console.error("Error fetching hero image:", error)
    }
  }

  const fetchRooms = async () => {
    try {
      const roomsCollection = collection(db, "rooms")
      const roomsSnapshot = await getDocs(roomsCollection)

      const roomsList: Room[] = []
      roomsSnapshot.forEach((doc) => {
        const data = doc.data() as any
        roomsList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        })
      })

      setRooms(roomsList)
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // ფუნქცია რომ მივიღოთ ოთახის სურათები სორტირებული პოზიციის მიხედვით
  const getOrderedImages = (room: Room) => {
    // თუ არის ახალი ფორმატის მონაცემები (images მასივით)
    if (room.images && room.images.length > 0) {
      return [...room.images].sort((a, b) => a.position - b.position).map(img => img.url)
    } 
    
    // თუ არის ძველი ფორმატის მონაცემები (მხოლოდ imageUrl-ით)
    return [room.imageUrl]
  }

  // ფოტოს დიალოგის გახსნა
  const openImageDialog = (room: Room) => {
    setSelectedRoom(room)
    setImageDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              <a href="/" className="text-sm hover:text-orange-400 transition-colors">
                HOME
              </a>
              <a href="/rooms" className="text-sm text-orange-400">
                COTTAGES
              </a>
              <a href="/gallery" className="text-sm hover:text-orange-400 transition-colors">
                GALLERY
              </a>
              <a href="/fine-dining" className="text-sm hover:text-orange-400 transition-colors">
                FINE DINING
              </a>
              <a href="/wines" className="text-sm hover:text-orange-400 transition-colors">
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

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <Image
            src={heroImageUrl}
            alt="Hotel Cottage"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 text-center">
          <div className="bg-black/60 backdrop-blur-sm p-8 rounded-lg max-w-md">
            <h1 className="text-2xl font-bold mb-4">COTTAGES</h1>
            <p className="text-gray-200 mb-6">
              8 boutique and 14 modern uniquely decorated cottages for business and leisure guests,
              we can accommodate up to 28 guests at once.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">Book Now</Button>
          </div>
        </div>
      </section>

      {/* Cottages Section */}
      {loading ? (
        <div className="py-20 bg-white text-gray-900 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cottages...</p>
        </div>
      ) : rooms.length > 0 ? (
        <>
          {rooms.map((room, index) => {
            const roomImages = getOrderedImages(room)
            
            return (
              <section 
                key={room.id} 
                className={`py-20 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'} text-gray-900`}
              >
                <div className="container mx-auto px-4">
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {index % 2 === 0 ? (
                      <>
                        <div className="relative cursor-pointer" onClick={() => openImageDialog(room)}>
                          <Carousel className="w-full">
                            <CarouselContent>
                              {roomImages.map((imageUrl, imgIndex) => (
                                <CarouselItem key={imgIndex}>
                                  <div className="relative h-96 w-full group">
                                    <Image
                                      src={imageUrl || "/placeholder.svg?height=400&width=600"}
                                      alt={`${room.name} - Photo ${imgIndex + 1}`}
                                      fill
                                      className="object-cover rounded-lg"
                                      loading="lazy"
                                      sizes="(max-width: 1024px) 100vw, 50vw"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                      <div className="bg-white/90 rounded-full p-3">
                                        <Search className="h-6 w-6 text-gray-800" />
                                      </div>
                                    </div>
                                    {roomImages.length > 1 && (
                                      <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                                        {imgIndex + 1} / {roomImages.length}
                                      </div>
                                    )}
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            {roomImages.length > 1 && (
                              <>
                                <CarouselPrevious className="left-2" onClick={(e) => e.stopPropagation()} />
                                <CarouselNext className="right-2" onClick={(e) => e.stopPropagation()} />
                              </>
                            )}
                          </Carousel>
                        </div>
                        <div className="space-y-6">
                          <h2 className="text-3xl font-bold">{room.name}</h2>
                          <p className="text-gray-600 leading-relaxed">{room.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-blue-600">{room.price} GEL</span>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Book Now</Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-6 order-2 lg:order-1">
                          <h2 className="text-3xl font-bold">{room.name}</h2>
                          <p className="text-gray-600 leading-relaxed">{room.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-blue-600">{room.price} GEL</span>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Book Now</Button>
                          </div>
                        </div>
                        <div className="relative order-1 lg:order-2 cursor-pointer" onClick={() => openImageDialog(room)}>
                          <Carousel className="w-full">
                            <CarouselContent>
                              {roomImages.map((imageUrl, imgIndex) => (
                                <CarouselItem key={imgIndex}>
                                  <div className="relative h-96 w-full group">
                                    <Image
                                      src={imageUrl || "/placeholder.svg?height=400&width=600"}
                                      alt={`${room.name} - Photo ${imgIndex + 1}`}
                                      fill
                                      className="object-cover rounded-lg"
                                      loading="lazy"
                                      sizes="(max-width: 1024px) 100vw, 50vw"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                      <div className="bg-white/90 rounded-full p-3">
                                        <Search className="h-6 w-6 text-gray-800" />
                                      </div>
                                    </div>
                                    {roomImages.length > 1 && (
                                      <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                                        {imgIndex + 1} / {roomImages.length}
                                      </div>
                                    )}
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            {roomImages.length > 1 && (
                              <>
                                <CarouselPrevious className="left-2" onClick={(e) => e.stopPropagation()} />
                                <CarouselNext className="right-2" onClick={(e) => e.stopPropagation()} />
                              </>
                            )}
                          </Carousel>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </section>
            )
          })}
        </>
      ) : (
        <div className="py-20 bg-white text-gray-900 text-center">
          <p className="text-gray-600">Currently no cottages are available. Please check back later.</p>
        </div>
      )}

      {/* Photo Enlargement Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedRoom?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedRoom && (
            <div className="mt-4 overflow-hidden">
              <Carousel className="w-full">
                <CarouselContent>
                  {selectedRoom.images && selectedRoom.images.length > 0 ? (
                    selectedRoom.images
                      .sort((a, b) => a.position - b.position)
                      .map((image, index) => (
                        <CarouselItem key={index}>
                          <div className="p-1">
                            <div className="relative rounded-lg overflow-hidden aspect-video h-[60vh]">
                              <img 
                                src={image.url} 
                                alt={`${selectedRoom.name} - Photo ${index + 1}`} 
                                className="w-full h-full object-contain"
                              />
                              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                Photo {index + 1} / {selectedRoom.images.length}
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      ))
                  ) : (
                    <CarouselItem>
                      <div className="p-1">
                        <div className="relative rounded-lg overflow-hidden aspect-video h-[60vh]">
                          <img 
                            src={selectedRoom.imageUrl} 
                            alt={selectedRoom.name} 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    </CarouselItem>
                  )}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
