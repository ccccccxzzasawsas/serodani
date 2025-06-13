"use client"
import { useEffect, useState } from "react"
import { listenToBooking } from "@/lib/realtimeDb"
import type { Booking } from "@/types"

export function BookingStatus({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<Booking | null>(null)

  useEffect(() => {
    if (!bookingId) return

    const unsubscribe = listenToBooking(bookingId, (data) => {
      setBooking(data)
    })

    return () => unsubscribe()
  }, [bookingId])

  if (!booking) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg text-center">
        <p>Loading booking status...</p>
      </div>
    )
  }

  const getStatusColor = () => {
    switch (booking.status) {
      case "confirmed":
        return "text-green-600"
      case "pending":
        return "text-yellow-600"
      case "cancelled":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="font-semibold text-blue-800">Booking Status</h4>
      <p className={`text-lg font-bold capitalize ${getStatusColor()}`}>
        {booking.status}
      </p>
    </div>
  )
} 