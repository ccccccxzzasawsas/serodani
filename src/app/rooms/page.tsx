"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
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
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { BookingModal } from "@/components/booking/BookingModal"
import { fetchRooms } from "@/lib/data-fetching"

export default function RoomsPage() {
  const { user, signOut } = useAuth()
  const [allRooms, setAllRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [heroImageUrl, setHeroImageUrl] = useState<string>("/room/hero.jpg")
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [selectedRoomForImage, setSelectedRoomForImage] = useState<Room | null>(null)
  
  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null)

  useEffect(() => {
    fetchAllRooms()
    fetchHeroImage()
  }, [])

  const fetchHeroImage = async () => {
    try {
      const docRef = doc(db, "sections", "roomsHero")
      const docSnap = await getDoc(docRef)
      if (docSnap.exists() && docSnap.data().imageUrl) {
        setHeroImageUrl(docSnap.data().imageUrl)
      }
    } catch (error) {
      console.error("Error fetching hero image:", error)
    }
  }

  const fetchAllRooms = async () => {
    try {
      setLoading(true)
      const roomsList = await fetchRooms()
      
      const sortedRooms = roomsList.sort((a, b) => (a.position || 0) - (b.position || 0))
      setAllRooms(sortedRooms)
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

  const getOrderedImages = (room: Room) => {
    if (room.images && room.images.length > 0) {
      return [...room.images].sort((a, b) => a.position - b.position).map(img => img.url)
    } 
    return [room.imageUrl]
  }

  const openImageDialog = (room: Room) => {
    setSelectedRoomForImage(room)
    setImageDialogOpen(true)
  }
  
  const openBookingDialog = (room: Room) => {
    setSelectedRoomForBooking(room)
    setBookingModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              <a href="/" className="text-sm hover:text-orange-400 transition-colors">HOME</a>
              <a href="/rooms" className="text-sm text-orange-400">COTTAGES</a>
              <a href="/gallery" className="text-sm hover:text-orange-400 transition-colors">GALLERY</a>
              <a href="/fine-dining" className="text-sm hover:text-orange-400 transition-colors">RESTAURANT</a>
              <a href="/wine" className="text-sm hover:text-orange-400 transition-colors">WINE</a>
              <a href="/contact" className="text-sm hover:text-orange-400 transition-colors">CONTACT</a>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4" />
                    <span>{user.displayName || user.email}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-orange-400 hover:text-orange-300">Sign Out</Button>
                </div>
              ) : (
                <Link href="/admin/login">
                  <Button variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300 hover:bg-orange-400/10">
                    <User className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <Image src={heroImageUrl} alt="Wooden cottages in Georgia – Cottage Stay in Kakheti" fill className="object-cover" priority sizes="100vw" />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 text-center" style={{ position: "absolute", top: "15%" }}>
          <div className="bg-black/60 backdrop-blur-sm p-8 rounded-lg">
            <h1 className="text-4xl font-bold">OUR WOODEN COTTAGES IN KAKHETI</h1>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="py-20 bg-white text-gray-900 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cottages...</p>
        </div>
      ) : allRooms.length === 0 ? (
        <div className="py-20 bg-white text-gray-900 text-center">
          <p className="text-gray-600">Currently no cottages are available. Please check back later.</p>
        </div>
      ) : (
        <>
          {allRooms.map((room, index) => {
            const roomImages = getOrderedImages(room)
            
            return (
              <section key={room.id} className={`py-20 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'} text-gray-900`}>
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
                                    <Image src={imageUrl || "/placeholder.svg?height=400&width=600"} alt={`${room.name} - Photo ${imgIndex + 1}`} fill className="object-cover rounded-lg" loading="lazy" sizes="(max-width: 1024px) 100vw, 50vw" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                      <div className="bg-white/90 rounded-full p-3">
                                        <Search className="h-6 w-6 text-gray-800" />
                                      </div>
                                    </div>
                                    {roomImages.length > 1 && (
                                      <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">{imgIndex + 1} / {roomImages.length}</div>
                                    )}
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            {roomImages.length > 1 && (
                              <>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <CarouselPrevious className="left-2" />
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <CarouselNext className="right-2" />
                                </div>
                              </>
                            )}
                          </Carousel>
                        </div>
                        <div className="space-y-6">
                          <h2 className="text-3xl font-bold">{room.name}</h2>
                          {room.description && <p className="text-gray-600 leading-relaxed">{room.description}</p>}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div>
                              <p className="text-gray-500">Sleeps: {room.beds} guests</p>
                            </div>
                            <Button onClick={() => openBookingDialog(room)} className="bg-blue-600 hover:bg-blue-700 text-white">Book Now</Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-6 order-2 lg:order-1">
                          <h2 className="text-3xl font-bold">{room.name}</h2>
                          {room.description && <p className="text-gray-600 leading-relaxed">{room.description}</p>}
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div>
                              <p className="text-gray-500">Sleeps: {room.beds} guests</p>
                            </div>
                            <Button onClick={() => openBookingDialog(room)} className="bg-blue-600 hover:bg-blue-700 text-white">Book Now</Button>
                          </div>
                        </div>
                        <div className="relative order-1 lg:order-2 cursor-pointer" onClick={() => openImageDialog(room)}>
                          <Carousel className="w-full">
                            <CarouselContent>
                              {roomImages.map((imageUrl, imgIndex) => (
                                <CarouselItem key={imgIndex}>
                                  <div className="relative h-96 w-full group">
                                    <Image src={imageUrl || "/placeholder.svg?height=400&width=600"} alt={`${room.name} - Photo ${imgIndex + 1}`} fill className="object-cover rounded-lg" loading="lazy" sizes="(max-width: 1024px) 100vw, 50vw" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                      <div className="bg-white/90 rounded-full p-3">
                                        <Search className="h-6 w-6 text-gray-800" />
                                      </div>
                                    </div>
                                    {roomImages.length > 1 && (
                                      <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">{imgIndex + 1} / {roomImages.length}</div>
                                    )}
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            {roomImages.length > 1 && (
                              <>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <CarouselPrevious className="left-2" />
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <CarouselNext className="right-2" />
                                </div>
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
      )}

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{selectedRoomForImage?.name}</DialogTitle>
            <DialogDescription>View photos of {selectedRoomForImage?.name}</DialogDescription>
          </DialogHeader>
          
          {selectedRoomForImage && (
            <div className="mt-4 overflow-hidden">
              <Carousel className="w-full">
                <CarouselContent>
                  {getOrderedImages(selectedRoomForImage).map((imageUrl, index) => (
                    <CarouselItem key={index}>
                      <div className="p-1">
                        <div className="relative rounded-lg overflow-hidden aspect-video h-[60vh] bg-gray-100">
                          <img src={imageUrl} alt={`${selectedRoomForImage.name} - Photo ${index + 1}`} className="w-full h-full object-contain" />
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">Photo {index + 1} / {getOrderedImages(selectedRoomForImage).length}</div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <BookingModal 
        isOpen={bookingModalOpen} 
        onClose={() => setBookingModalOpen(false)}
        room={selectedRoomForBooking}
      />

      <Footer />
    </div>
  )
}
