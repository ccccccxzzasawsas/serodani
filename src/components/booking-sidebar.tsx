"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import type { Room } from "@/types"
import { useAuth } from "@/lib/auth"
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "@/components/ui/use-toast"
import { DateRange } from "react-day-picker"
import { differenceInCalendarDays, format } from "date-fns"
import { checkFirestoreBookingOverlap } from "@/lib/booking-utils"

interface BookingSidebarProps {
  room: Room
  dates: DateRange
  onBookingSuccess: () => void
}

export function BookingSidebar({ room, dates, onBookingSuccess }: BookingSidebarProps) {
  const { user } = useAuth()
  const [guests, setGuests] = useState(room.minGuests || 1)
  const [totalPrice, setTotalPrice] = useState(0)
  const [loading, setLoading] = useState(false)

  const nights = differenceInCalendarDays(dates.to!, dates.from!)

  useEffect(() => {
    if (nights > 0) {
      setTotalPrice(room.price * nights)
    }
  }, [room, nights])

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a room.",
        variant: "destructive",
      })
      // Optionally redirect to login page
      return
    }

    if (!dates.from || !dates.to) return

    setLoading(true)
    try {
      // Check for overlapping bookings first
      try {
        const hasOverlap = await checkFirestoreBookingOverlap(
          room.id,
          dates.from,
          dates.to
        )

        if (hasOverlap) {
          toast({
            title: "Booking Failed",
            description: "This room is already booked for the selected dates. Please choose different dates.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      } catch (overlapError) {
        console.warn("Could not check for overlapping bookings:", overlapError);
        // Continue with booking even if overlap check fails
      }

      // Proceed with booking creation
      await addDoc(collection(db, "bookings"), {
        roomId: room.id,
        userId: user.uid,
        checkIn: dates.from,
        checkOut: dates.to,
        guests: Number(guests),
        totalPrice,
        roomName: room.name, // For easier display later
        createdAt: new Date(),
        status: "pending", // Add status for consistency with Realtime DB
      })

      toast({
        title: "Booking Successful!",
        description: `Your booking for ${room.name} has been confirmed.`,
      })
      onBookingSuccess()
    } catch (error) {
      console.error("Error creating booking:", error)
      
      // Check if this is an index error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("requires an index")) {
        toast({
          title: "Booking System Maintenance",
          description: "Our booking system is being updated. Please try again in a few minutes.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Booking Failed",
          description: "There was an error processing your booking. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed top-1/2 right-4 transform -translate-y-1/2 bg-gray-800 p-6 rounded-lg shadow-2xl w-96 text-white border border-gray-700">
      <h3 className="text-xl font-bold mb-2">Reservation</h3>
      <div className="border-b border-gray-600 pb-4 mb-4">
        <p className="font-semibold">{room.name}</p>
        <p className="text-sm text-gray-400">
          {format(dates.from!, "MMM dd, yyyy")} - {format(dates.to!, "MMM dd, yyyy")}
        </p>
      </div>
      
      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="guests">Number of Guests</Label>
          <Input
            id="guests"
            type="number"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            min={room.minGuests || 1}
            max={room.maxGuests || room.capacity}
            className="bg-gray-700 border-gray-600 text-white"
          />
          <p className="text-xs text-gray-500 mt-1">
            Min: {room.minGuests || 1}, Max: {room.maxGuests || room.capacity}
          </p>
        </div>
        
        <div className="flex justify-between items-center text-lg">
          <span className="font-semibold">Total Price:</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        <p className="text-sm text-gray-400">{nights} night(s) at ${room.price}/night</p>
      </div>

      <Button onClick={handleBooking} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Next"}
      </Button>
    </div>
  )
} 