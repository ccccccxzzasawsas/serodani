"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CalendarIcon, Users, Bed, ChevronLeft, Loader2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { createBooking, checkRoomAvailability, getAvailableRooms } from "@/lib/booking-utils"
import type { Room } from "@/types"
import { BookingStatus } from "@/components/booking/booking-status"
import { Textarea } from "@/components/ui/textarea"

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  room: Room | null
}

export function BookingModal({ isOpen, onClose, room }: BookingModalProps) {
  // State ცვლადები
  const [step, setStep] = useState(1) // დაჯავშნის პროცესის ეტაპი: 1=თარიღები, 2=პირადი ინფო
  const [checkIn, setCheckIn] = useState<Date>()
  const [checkOut, setCheckOut] = useState<Date>()
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [checkOutOpen, setCheckOutOpen] = useState(false)
  const [numberOfRooms, setNumberOfRooms] = useState("1")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [country, setCountry] = useState("")
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [bookingId, setBookingId] = useState<string | undefined>()
  const [availableRooms, setAvailableRooms] = useState<{ 
    room: Room; 
    availableCount: number;
    availableRegularBeds: number;
    availableExtraBeds: number;
    needsExtraBeds: boolean;
  }[]>([])
  const [showingAlternatives, setShowingAlternatives] = useState(false)
  const [selectedAlternativeRoom, setSelectedAlternativeRoom] = useState<Room | null>(null)
  const [availabilityInfo, setAvailabilityInfo] = useState<{
    totalBeds: number;
    availableCount: number;
    availableRegularBeds: number;
    availableExtraBeds: number;
    requestedBeds: number;
    needsExtraBeds: boolean;
  } | null>(null)
  // დამატებითი საწოლების გამოყენების თანხმობის დიალოგის სტეიტი
  const [showExtraBedsConfirm, setShowExtraBedsConfirm] = useState(false)
  const [extraBedsConfirmed, setExtraBedsConfirmed] = useState(false)

  // ოთახის ინფორმაცია
  const totalRooms = (room as any)?.totalRooms || 1
  const beds = (room as any)?.beds || 2
  
  // დებაგის ინფორმაცია
  useEffect(() => {
    if (selectedAlternativeRoom) {
      console.log('Current room data:', selectedAlternativeRoom);
      const options = generateBedsOptions(selectedAlternativeRoom, Number(numberOfRooms));
      console.log('Generated bed options:', options);
    }
  }, [selectedAlternativeRoom, numberOfRooms]);
  
  // თარიღების ცვლილების დროს ოთახების ხელმისაწვდომობის გადამოწმება
  useEffect(() => {
    // გავასუფთავოთ წინა შედეგები
    setAvailableRooms([])
    setShowingAlternatives(false)
    setSelectedAlternativeRoom(null)
    
    if (checkIn && checkOut) {
      // დროებით არაფერი - ამ ფუნქციონალს საჭიროებისამებრ გავააქტიურებთ
    }
  }, [checkIn, checkOut])

  // ღამეების რაოდენობის გამოთვლა
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // ჯამური ფასის გამოთვლა - საჭიროა მხოლოდ შიდა გამოყენებისთვის
  const calculateTotal = () => {
    // ფუნქცია რჩება შიდა ლოგიკისთვის, მაგრამ არ ჩანს UI-ში
    const nights = calculateNights()
    const beds = Number.parseInt(numberOfRooms)
    const currentRoom = selectedAlternativeRoom || room
    
    // თუ არ გვაქვს ოთახი ან რაოდენობა, დავაბრუნოთ 0
    if (!currentRoom || isNaN(beds)) return 0
    
    // ვიპოვოთ შესაბამისი ფასი საწოლების რაოდენობის მიხედვით
    let pricePerNight = currentRoom.price // ნაგულისხმევად ვიყენებთ ძირითად ფასს
    
    // თუ გვაქვს bedPrices კონფიგურაცია
    if (currentRoom.bedPrices && currentRoom.bedPrices.length > 0) {
      // ვიპოვოთ შესაბამისი ფასი საწოლების რაოდენობის მიხედვით
      const matchingPrice = currentRoom.bedPrices.find(bp => bp.beds === beds)
      if (matchingPrice) {
        pricePerNight = matchingPrice.price
      }
    }
    
    // ფასი მხოლოდ ღამეების რაოდენობაზე მრავლდება, საწოლების რაოდენობა აღარ მონაწილეობს გამოთვლაში
    return nights * pricePerNight
  }
  
  // ალტერნატიული ოთახის არჩევა
  const selectAlternativeRoom = (alternativeRoom: Room) => {
    setSelectedAlternativeRoom(alternativeRoom)
    // რაოდენობის გაწმენდა, რომ ახლიდან ამოირჩიოს
    setNumberOfRooms("1")
    setError("")
  }
  
  // მიიღე ხელმისაწვდომი ალტერნატიული ოთახები
  const fetchAvailableRooms = async () => {
    try {
      const checkInStr = checkIn?.toISOString().split("T")[0]
      const checkOutStr = checkOut?.toISOString().split("T")[0]
      
      if (!checkInStr || !checkOutStr) return
      
      const requestedBeds = Number.parseInt(numberOfRooms)
      const availableRoomsList = await getAvailableRooms(
        checkInStr,
        checkOutStr,
        requestedBeds,
        extraBedsConfirmed
      )
      
      // გამოვტოვოთ მიმდინარე ოთახი შედეგებიდან
      setAvailableRooms(availableRoomsList.filter(item => item.room.id !== room?.id))
      setShowingAlternatives(true)
    } catch (error) {
      console.error("Error fetching available rooms:", error)
    }
  }
  
  // დამატებითი საწოლების გამოყენების დადასტურება
  const handleExtraBedsConfirm = () => {
    setShowExtraBedsConfirm(false)
    setExtraBedsConfirmed(true) // მონიშნავს, რომ მომხმარებელმა დაადასტურა დამატებითი საწოლების გამოყენება
    
    // თუ უკვე მეორე ეტაპზე ვართ, ვცადოთ ჯავშნის განახლება
    if (step === 2) {
      handleBooking();
    } else {
      setStep(2) // გადავიდეთ შემდეგ ეტაპზე
    }
  }

  // დამატებითი საწოლების გამოყენებაზე უარი
  const handleExtraBedsCancel = () => {
    setShowExtraBedsConfirm(false)
    setExtraBedsConfirmed(false)
    // არ ვცვლით ეტაპს, მომხმარებელი რჩება პირველ ეტაპზე
  }
  
  // პირველი ეტაპიდან მეორეზე გადასვლა
  const handleNext = async () => {
    // ვალიდაცია
    if (!checkIn || !checkOut) {
      setError("Please select check-in and check-out dates")
      return
    }

    if (checkOut <= checkIn) {
      setError("Check-out date must be after check-in date")
      return
    }

    const requestedBeds = Number.parseInt(numberOfRooms)
    const currentRoom = selectedAlternativeRoom || room
    
    if (!currentRoom) {
      setError("No room selected")
      return
    }
    
    if (!numberOfRooms || numberOfRooms === "0") {
      setError("Please select the number of beds")
      return
    }
    
    try {
      setLoading(true)

      // ხელმისაწვდომობის შემოწმება
      const regularBeds = (currentRoom.beds || 2) * (currentRoom.totalRooms || 1);
      const extraBeds = currentRoom.extraBeds || 0;
      const totalBeds = regularBeds + extraBeds;
      console.log(`Checking availability for room ${currentRoom.id}: regularBeds=${regularBeds}, extraBeds=${extraBeds}, totalBeds=${totalBeds}, requestedBeds=${requestedBeds}`);
      
      try {
        const availabilityResult = await checkRoomAvailability(
          currentRoom.id,
          checkIn.toISOString().split("T")[0],
          checkOut.toISOString().split("T")[0],
          requestedBeds,
          totalBeds,
          extraBedsConfirmed
        )

        // შევინახოთ ხელმისაწვდომობის ინფორმაცია
        setAvailabilityInfo({
          totalBeds,
          availableCount: availabilityResult.availableCount,
          availableRegularBeds: availabilityResult.availableRegularBeds,
          availableExtraBeds: availabilityResult.availableExtraBeds,
          requestedBeds,
          needsExtraBeds: availabilityResult.needsExtraBeds
        });

        // თუ საჭიროა დამატებითი საწოლების გამოყენება, ვაჩვენოთ დადასტურების დიალოგი
        if (availabilityResult.needsExtraBeds && !extraBedsConfirmed) {
          setShowExtraBedsConfirm(true);
          setLoading(false);
          return;
        }

        if (!availabilityResult.available) {
          setError(`Sorry, this room is no longer available for the selected dates. Only ${availabilityResult.availableCount} beds available.`)
          
          // მხოლოდ იმ შემთხვევაში მოვითხოვოთ ალტერნატივები, თუ ეს არის პირვანდელი ოთახი და არა ალტერნატიული
          if (!selectedAlternativeRoom) {
            await fetchAvailableRooms()
          }
          
          setLoading(false)
          return
        }
      } catch (availabilityError) {
        // შევამოწმოთ არის თუ არა შეცდომა დაკავშირებული დამატებითი საწოლების დადასტურებასთან
        const errorMessage = availabilityError instanceof Error ? availabilityError.message : String(availabilityError);
        
        if (errorMessage.includes("Extra beds confirmation required")) {
          // მივიღოთ ინფორმაცია ხელმისაწვდომი საწოლების შესახებ
          const regularBedsMatch = errorMessage.match(/Regular beds available: (\d+)/);
          const extraBedsMatch = errorMessage.match(/extra beds available: (\d+)/);
          
          const regularBedsAvailable = regularBedsMatch ? parseInt(regularBedsMatch[1]) : 0;
          const extraBedsAvailable = extraBedsMatch ? parseInt(extraBedsMatch[1]) : 0;
          
          // შევინახოთ ინფორმაცია და ვაჩვენოთ დადასტურების დიალოგი
          setAvailabilityInfo({
            totalBeds: regularBedsAvailable + extraBedsAvailable,
            availableCount: regularBedsAvailable + extraBedsAvailable,
            availableRegularBeds: regularBedsAvailable,
            availableExtraBeds: extraBedsAvailable,
            requestedBeds,
            needsExtraBeds: true
          });
          
          setShowExtraBedsConfirm(true);
          setLoading(false);
          return;
        }
        
        // სხვა შეცდომების შემთხვევაში, გადავცეთ ზემოთ
        throw availabilityError;
      }
      
      // შეცდომა არ არის და არც დამატებითი საწოლებია საჭირო, გადავიდეთ მეორე ეტაპზე
      setError("")
      setStep(2)
    } catch (error) {
      console.error("Error checking availability:", error)
      setError("Failed to check availability. Please try again later.")
    } finally {
      setLoading(false)
    }
  }
  
  // უკან დაბრუნება
  const goBack = () => {
    setStep(1)
    setError("")
  }

  // დაჯავშნის ფუნქცია
  const handleBooking = async () => {
    // ვალიდაცია
    if (!firstName || !lastName || !guestEmail || !confirmEmail) {
      setError("Please fill in all required fields")
      return
    }
    
    if (guestEmail !== confirmEmail) {
      setError("Email addresses don't match")
      return
    }
    
    // ემაილის ვალიდაციის მარტივი შემოწმება
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(guestEmail)) {
      setError("Please enter a valid email address")
      return
    }

    setLoading(true)
    setError("")

    try {
      const requestedBeds = Number.parseInt(numberOfRooms)
      const currentRoom = selectedAlternativeRoom || room
      
      if (!currentRoom || !checkIn || !checkOut) {
        setError("Missing booking information")
        setLoading(false)
        return
      }
      
      console.log("Starting booking process for:", {
        roomId: currentRoom.id,
        checkIn: checkIn.toISOString().split("T")[0],
        checkOut: checkOut.toISOString().split("T")[0],
        requestedBeds,
        totalRooms: currentRoom.totalRooms,
        extraBedsConfirmed
      })

      // დაჯავშნის მონაცემები
      const bookingData = {
        roomId: currentRoom.id,
        roomName: currentRoom.name,
        guestName: `${firstName} ${lastName}`,
        guestEmail,
        guestPhone,
        checkIn: checkIn.toISOString().split("T")[0],
        checkOut: checkOut.toISOString().split("T")[0],
        numberOfRooms: requestedBeds,
        totalPrice: calculateTotal(),
        // დამატებითი ინფორმაცია
        country,
        comment,
        extraBedsConfirmed // დავამატოთ ინფორმაცია დამატებითი საწოლების დადასტურების შესახებ
      }

      console.log("Submitting booking:", bookingData)

      try {
        // დაჯავშნის შექმნა
        const bookingIdResult = await createBooking(bookingData)
        console.log("Booking created with ID:", bookingIdResult)
        setBookingId(bookingIdResult)
        setSuccess(true)
      } catch (bookingError) {
        // შევამოწმოთ არის თუ არა შეცდომა დაკავშირებული დამატებითი საწოლების დადასტურებასთან
        const errorMessage = bookingError instanceof Error ? bookingError.message : String(bookingError);
        
        if (errorMessage.includes("Extra beds confirmation required")) {
          // მივიღოთ ინფორმაცია ხელმისაწვდომი საწოლების შესახებ
          const regularBedsMatch = errorMessage.match(/Regular beds available: (\d+)/);
          const extraBedsMatch = errorMessage.match(/extra beds available: (\d+)/);
          
          const regularBeds = regularBedsMatch ? parseInt(regularBedsMatch[1]) : 0;
          const extraBedsAvailable = extraBedsMatch ? parseInt(extraBedsMatch[1]) : 0;
          
          // შევინახოთ ინფორმაცია და ვაჩვენოთ დადასტურების დიალოგი
          setAvailabilityInfo({
            totalBeds: regularBeds + extraBedsAvailable,
            availableCount: regularBeds + extraBedsAvailable,
            availableRegularBeds: regularBeds,
            availableExtraBeds: extraBedsAvailable,
            requestedBeds,
            needsExtraBeds: true
          });
          
          setShowExtraBedsConfirm(true);
          setLoading(false);
          return;
        }
        
        // სხვა შეცდომების შემთხვევაში, გადავცეთ ზემოთ
        throw bookingError;
      }

      // არ ვხურავთ მოდალს ავტომატურად, გვინდა რომ მომხმარებელმა დაინახოს დადასტურების შეტყობინება
      // ფორმის გასუფთავების ლოგიკა გადავიტანოთ დახურვის ფუნქციაში
      
      // დავარეგისტრიროთ დახურვის ფუნქცია, რომელიც გაწმენდს ფორმას დახურვის შემდეგ
      const originalOnClose = onClose;
      onClose = () => {
        originalOnClose();
        // ფორმის გასუფთავება
        setStep(1)
        setCheckIn(undefined)
        setCheckOut(undefined)
        setNumberOfRooms("1")
        setFirstName("")
        setLastName("")
        setGuestEmail("")
        setConfirmEmail("")
        setGuestPhone("")
        setCountry("")
        setComment("")
        setSelectedAlternativeRoom(null)
        setAvailableRooms([])
        setShowingAlternatives(false)
        setSuccess(false)
        setAvailabilityInfo(null)
        setExtraBedsConfirmed(false)
      };
    } catch (error) {
      console.error("Booking error:", error)
      setError(
        "Failed to create booking. Please try again. Error: " +
          (error instanceof Error ? error.message : String(error)),
      )
    } finally {
      setLoading(false)
    }
  }

  // თუ ოთახი არ არის არჩეული, არაფერი არ გამოჩნდეს
  if (!room && !selectedAlternativeRoom) return null

  // მიმდინარე აქტიური ოთახი (ან პირვანდელი, ან ალტერნატიული)
  const currentRoom = selectedAlternativeRoom || room
  if (!currentRoom) return null

  const roomTotalRooms = currentRoom.totalRooms || 1
  const roomBeds = currentRoom.beds || 2
  const roomExtraBeds = currentRoom.extraBeds || 0
  const maxTotalBeds = roomBeds * roomTotalRooms + roomExtraBeds
  
  // ხელმისაწვდომი საწოლების რაოდენობა - ან ალტერნატიული ოთახიდან ან მიმდინარე ოთახიდან
  const availableCount = selectedAlternativeRoom 
    ? (availableRooms.find(r => r.room.id === currentRoom.id)?.availableCount || maxTotalBeds) 
    : maxTotalBeds

  console.log('Room data:', {
    name: currentRoom.name,
    beds: currentRoom.beds,
    extraBeds: currentRoom.extraBeds,
    minBookingBeds: currentRoom.minBookingBeds,
    totalRooms: currentRoom.totalRooms,
    maxTotalBeds,
    availableCount
  });

  // ეს ფუნქცია გამოიყენება საწოლების ვარიანტების გენერაციისთვის
  const generateBedsOptions = (room: Room, availableCount: number): { value: number; label: string }[] => {
    const options: { value: number; label: string }[] = [];
    const minBeds = room.minBookingBeds || 1;
    const maxRegularBeds = (room.beds || 2) * (room.totalRooms || 1);
    const extraBeds = room.extraBeds || 0;
    const maxTotalBeds = maxRegularBeds + extraBeds;
    
    // ვამოწმებთ რამდენი საწოლის დაჯავშნაა შესაძლებელი
    const maxBookableBeds = Math.min(maxTotalBeds, availableCount);
    
    console.log('Generating bed options:', {
      minBeds,
      maxRegularBeds,
      extraBeds,
      maxTotalBeds,
      maxBookableBeds,
      availableCount
    });
    
    // დავამატოთ ჩვეულებრივი საწოლების ვარიანტები minBookingBeds-დან დაწყებული
    // მაქსიმუმ ძირითად საწოლებამდე (beds * totalRooms)
    for (let i = minBeds; i <= Math.min(maxRegularBeds, maxBookableBeds); i++) {
      options.push({ value: i, label: `${i} beds` });
    }
    
    // თუ გვაქვს დამატებითი საწოლები, დავამატოთ ისინი "X+Y extra bed" ფორმატით
    if (extraBeds > 0) {
      for (let i = 1; i <= extraBeds && (maxRegularBeds + i) <= maxBookableBeds; i++) {
        options.push({ 
          value: maxRegularBeds + i, 
          label: `${maxRegularBeds}+${i} ${i === 1 ? 'extra bed' : 'extra beds'}`
        });
      }
    }
    
    // თუ ოფციები ცარიელია, დავამატოთ მინიმუმ ერთი ოფცია
    if (options.length === 0 && minBeds <= maxBookableBeds) {
      options.push({ value: minBeds, label: `${minBeds} beds` });
    }
    
    console.log('Generated options:', options);
    return options;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-gray-100 border border-gray-300">
        <DialogHeader className="p-6 bg-serodani text-white">
          {/* სეროდანის ლოგო ზედა მარჯვენა კუთხეში */}
          <div className="absolute top-4 right-4 h-12 w-12">
            <Image 
              src="/serodani-logo.svg" 
              alt="Serodani Cottages" 
              width={48}
              height={48}
            />
          </div>
          
          <DialogTitle className="text-2xl font-serif">
            {step === 1 ? "Book Your Stay" : "Complete Booking"}
          </DialogTitle>
        </DialogHeader>
        
        {/* დამატებითი საწოლების გაფრთხილების დიალოგი */}
        {showExtraBedsConfirm && availabilityInfo && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">Bed Distribution Information</h3>
              <Alert className="mb-4 border-amber-500 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-600">Attention</AlertTitle>
                <AlertDescription>
                  Out of the {availabilityInfo.requestedBeds} beds you requested, 
                  only {availabilityInfo.availableRegularBeds} are regular beds.
                  The remaining {availabilityInfo.requestedBeds - availabilityInfo.availableRegularBeds} will be 
                  extra beds (sofa beds or other types of additional beds).
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={handleExtraBedsCancel}>
                  Go Back
                </Button>
                <Button onClick={handleExtraBedsConfirm}>
                  Accept and Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ეტაპი 1: თარიღების და ოთახების არჩევა */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* მარცხენა მხარე - ინფორმაცია */}
            <div className="space-y-6">
              {/* სურათი */}
              <div className="relative aspect-video overflow-hidden rounded-lg border-2 border-gray-300 shadow-md">
              <Image
                  src={currentRoom.imageUrl}
                  alt={currentRoom.name}
                fill
                className="object-cover"
              />
            </div>

            <div>
              {/* ოთახის სახელი და აღწერა */}
                <h3 className="text-xl font-bold mb-2 text-serodani">{currentRoom.name}</h3>
                <p className="text-gray-600 mb-4">{currentRoom.description}</p>

              {/* ოთახის დეტალები */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Bed className="w-4 h-4 text-serodani" />
                  <span className="text-sm">Regular beds: {currentRoom.beds || 2}</span>
                </div>
                {currentRoom.extraBeds && currentRoom.extraBeds > 0 && (
                  <div className="flex items-center space-x-2">
                    <Bed className="w-4 h-4 text-amber-500" />
                    <span className="text-sm">Extra beds available: {currentRoom.extraBeds}</span>
                  </div>
                )}
                {currentRoom.minBookingBeds && currentRoom.minBookingBeds > 1 && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-serodani" />
                    <span className="text-sm">Min booking: {currentRoom.minBookingBeds} beds</span>
                  </div>
                )}
              </div>
                
                {/* ალტერნატიული ოთახები */}
                {showingAlternatives && availableRooms.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-serodani">Other Available Beds</h4>
                    <div className="space-y-3">
                      {availableRooms.map((availableRoom) => (
                        <div 
                          key={availableRoom.room.id}
                          className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            selectedAlternativeRoom?.id === availableRoom.room.id 
                              ? 'border-gray-400 bg-gray-200' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => selectAlternativeRoom(availableRoom.room)}
                        >
                          <div className="flex gap-3 items-start">
                            {/* ალტერნატიული ოთახის ფოტო */}
                            <div className="relative h-20 w-24 flex-shrink-0 rounded-md overflow-hidden">
                              <Image
                                src={availableRoom.room.imageUrl}
                                alt={availableRoom.room.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <h5 className="font-medium text-serodani">{availableRoom.room.name}</h5>
                                <span className="text-sm font-semibold">{availableRoom.room.price} GEL</span>
                              </div>
                              <div className="text-sm text-gray-600 flex justify-between items-center">
                                <span>Available: {availableRoom.availableCount} beds</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* თუ ალტერნატივები ცარიელია, მაგრამ ჩვენება ჩართულია */}
                {showingAlternatives && availableRooms.length === 0 && (
                  <div className="mt-4 p-4 bg-gray-100 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      No other rooms available for the selected dates. Please try different dates.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* მარჯვენა მხარე - ფორმა */}
            <div className="space-y-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-4 text-serodani">Book Your Stay</h3>
                
                {/* თარიღების არჩევა */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="check-in" className="mb-1 block">
                      Check-in Date
                    </Label>
                    <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="check-in"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !checkIn && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkIn ? format(checkIn, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={checkIn}
                          onSelect={(date) => {
                            if (date) {
                              setCheckIn(date);
                              setTimeout(() => {
                              setCheckInOpen(false);
                              }, 0);
                            }
                          }}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label htmlFor="check-out" className="mb-1 block">
                      Check-out Date
                    </Label>
                    <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="check-out"
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !checkOut && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkOut ? format(checkOut, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={checkOut}
                          onSelect={(date) => {
                            if (date) {
                              setCheckOut(date);
                              setTimeout(() => {
                              setCheckOutOpen(false);
                              }, 0);
                            }
                          }}
                          initialFocus
                          disabled={(date) => !checkIn || date <= checkIn}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {/* საწოლების რაოდენობა */}
                <div className="mb-4">
                  <Label htmlFor="beds" className="mb-1 block">
                    Number of Beds
                  </Label>
                  <Select
                    value={numberOfRooms}
                    onValueChange={setNumberOfRooms}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-gray-500">
                      <SelectValue placeholder="Select number of beds" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-50 border border-gray-200 shadow-md">
                      {generateBedsOptions(currentRoom, availableCount).map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()} className="hover:bg-gray-100">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentRoom.minBookingBeds && currentRoom.minBookingBeds > 1 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Minimum booking of {currentRoom.minBookingBeds} beds required
                    </p>
                  )}
                  
                </div>

                {/* ფასი */}
                <div className="mb-6 p-4 bg-gray-100 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Price per night:</span>
                    <span className="font-semibold">
                      {(() => {
                        const beds = Number.parseInt(numberOfRooms);
                        let pricePerNight = currentRoom.price;
                        
                        // თუ გვაქვს bedPrices კონფიგურაცია
                        if (currentRoom.bedPrices && currentRoom.bedPrices.length > 0) {
                          // ვიპოვოთ შესაბამისი ფასი საწოლების რაოდენობის მიხედვით
                          const matchingPrice = currentRoom.bedPrices.find(bp => bp.beds === beds);
                          if (matchingPrice) {
                            pricePerNight = matchingPrice.price;
                          }
                        }
                        
                        return `${pricePerNight} GEL`;
                      })()}
                    </span>
                  </div>
                  {checkIn && checkOut && (
                    <>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm">Nights:</span>
                        <span>{calculateNights()}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm">Beds:</span>
                        <span>{numberOfRooms}</span>
                      </div>
                      <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between items-center">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold text-serodani">{calculateTotal()} GEL</span>
                      </div>
                    </>
                  )}
                </div>

                {/* შემდეგი ნაბიჯი */}
                <Button 
                  onClick={handleNext} 
                  className="w-full bg-gray-600 hover:bg-gray-700"
                  disabled={loading || !checkIn || !checkOut || !numberOfRooms}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking availability...
                    </>
                  ) : (
                    "Continue to Book"
                  )}
                </Button>
                
                {error && (
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                )}

                {availabilityInfo && !error && (
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                    <p>Availability check: {availabilityInfo.availableCount}/{availabilityInfo.totalBeds} beds available</p>
                    <p>Requested beds: {availabilityInfo.requestedBeds}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* ეტაპი 2: პირადი ინფორმაციის შეყვანა */}
        {step === 2 && (
          <div className="p-6 space-y-6">
            {/* წარმატების შეტყობინება */}
            {success && (
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg mb-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  Booking Confirmed!
                </h3>
                <p className="text-green-700 mb-3">
                  Your reservation has been successfully submitted. Confirmation #{bookingId}
                </p>
                <p className="text-green-600 text-sm mb-4">
                  A confirmation email has been sent to <span className="font-semibold">{guestEmail}</span>.
                </p>
                <div className="bg-white rounded-lg p-4 border border-green-200 text-left mb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">Check-in:</span> {format(checkIn!, "MMM dd, yyyy")}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">Check-out:</span> {format(checkOut!, "MMM dd, yyyy")}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Total:</span> {calculateTotal()} GEL
                  </p>
                </div>
                <p className="text-green-600 text-sm">
                  You can close this window now or contact us if you have any questions.
                </p>
              </div>
            )}
            
            {/* ჯავშნის სტატუსი */}
            {bookingId && !success && <BookingStatus bookingId={bookingId} />}

            {/* შეცდომის შეტყობინება */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* მოკლე ინფორმაცია ოთახის შესახებ */}
            {!success && (
              <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
                <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0 border border-gray-300">
                  <Image
                    src={currentRoom.imageUrl}
                    alt={currentRoom.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-serodani">{currentRoom.name}</h3>
                  <div className="text-sm text-gray-600">
                    <span>{calculateNights()} {calculateNights() === 1 ? "night" : "nights"}, {numberOfRooms} {Number(numberOfRooms) === 1 ? "bed" : "beds"}</span>
                  </div>
                  <div className="text-sm font-semibold text-serodani-dark">
                    <span>Total: {calculateTotal()} GEL</span>
                  </div>
                  {availabilityInfo && (
                    <div className="text-xs text-gray-500 mt-1">
                      Available: {availabilityInfo.availableCount}/{availabilityInfo.totalBeds} beds
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* პირადი ინფორმაციის ფორმა */}
            {!success && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* სახელი */}
                <div>
                    <Label htmlFor="firstName" className="text-serodani-dark">First Name *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      className="border-gray-300 focus-visible:ring-gray-400"
                    />
                  </div>
                  
                  {/* გვარი */}
                  <div>
                    <Label htmlFor="lastName" className="text-serodani-dark">Last Name *</Label>
                  <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      className="border-gray-300 focus-visible:ring-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ემაილი */}
                <div>
                    <Label htmlFor="email" className="text-serodani-dark">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Enter your email"
                      className="border-gray-300 focus-visible:ring-gray-400"
                    />
                  </div>
                  
                  {/* ემაილის დადასტურება */}
                  <div>
                    <Label htmlFor="confirmEmail" className="text-serodani-dark">Confirm Email *</Label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      placeholder="Confirm your email"
                      className="border-gray-300 focus-visible:ring-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ტელეფონი */}
                <div>
                    <Label htmlFor="phone" className="text-serodani-dark">Phone Number</Label>
                  <Input
                    id="phone"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Enter your phone number"
                      className="border-gray-300 focus-visible:ring-gray-400"
                    />
                  </div>
                  
                  {/* ქვეყანა */}
                  <div>
                    <Label htmlFor="country" className="text-serodani-dark">Country</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Enter your country"
                      className="border-gray-300 focus-visible:ring-gray-400"
                    />
                  </div>
                </div>
                
                {/* კომენტარი */}
                <div>
                  <Label htmlFor="comment" className="text-serodani-dark">Comment</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Special requests or additional information"
                    className="min-h-[100px] border-gray-300 focus-visible:ring-gray-400"
                  />
                </div>
              </div>
            )}

            {/* ღილაკები */}
            {!success && (
              <div className="flex justify-center gap-3">
                <Button
                  onClick={goBack}
                  variant="outline"
                  className="flex items-center border-gray-300 hover:bg-gray-100 hover:text-gray-700"
                  disabled={loading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                
                <Button
                  onClick={handleBooking}
                  disabled={loading || !firstName || !lastName || !guestEmail || !confirmEmail}
                  className="flex-1 max-w-[160px] bg-gray-600 hover:bg-gray-700 text-white"
                >
                  {loading ? "Processing..." : "Confirm"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 