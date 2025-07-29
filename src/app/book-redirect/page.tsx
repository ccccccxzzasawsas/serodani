"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, addDays } from 'date-fns'

export default function BookingRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // ვიღებთ პარამეტრებს URL-დან თუ არსებობს
  const roomId = searchParams.get('roomId')
  const checkInParam = searchParams.get('checkIn')
  const checkOutParam = searchParams.get('checkOut')
  const guests = searchParams.get('guests')
  
  // მთავარი ფუნქციონალი, რომელიც გადაამისამართებს Arealy-ზე
  useEffect(() => {
    // არეალის ოთახების ID-ების მეფინგი ჩვენს ID-ებთან
    // მაგალითად, თქვენი სისტემის "room-1" შეესაბამება Arealy-ს "173" ID-ს
    const roomMapping: Record<string, string> = {
      'default': '173', // Arealy-ს default ოთახი
      // აქ დაამატეთ სხვა ოთახების მეფინგი საჭიროების მიხედვით
    }
    
    // კონვერტაცია DATE ობიექტიდან Arealy-ს ფორმატში (DD.MM.YYYY)
    const formatDateForArealy = (dateString?: string | null) => {
      try {
        if (!dateString) return null
        
        // თუ მოგვეწოდა სტრინგ ფორმატში
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return null
        
        return format(date, "dd.MM.yyyy")
      } catch (e) {
        return null
      }
    }
    
    // მომავალი თარიღების გამოთვლა თუ არ არის მითითებული
    const today = new Date()
    const checkIn = formatDateForArealy(checkInParam) || format(addDays(today, 1), "dd.MM.yyyy")
    const checkOut = formatDateForArealy(checkOutParam) || format(addDays(today, 2), "dd.MM.yyyy")
    
    // არეალის ოთახის ID-ის მიღება
    const arealyRoomId = roomId ? (roomMapping[roomId] || roomMapping.default) : roomMapping.default
    
    // ავაგოთ redirect URL
    let redirectUrl = `/booking?checkInDate=${checkIn}&checkOutDate=${checkOut}`
    
    // თუ ოთახის ID გვაქვს, დავამატოთ
    if (arealyRoomId) {
      redirectUrl += `&roomType=${arealyRoomId}`
    }
    
    // რედირექტი
    router.replace(redirectUrl)
  }, [])
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-4">გთხოვთ დაიცადოთ</h1>
        <p className="text-gray-600 mb-6">ხდება გადამისამართება ჯავშნის სისტემაზე...</p>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-serodani animate-pulse rounded-full w-full"></div>
        </div>
      </div>
    </div>
  )
} 