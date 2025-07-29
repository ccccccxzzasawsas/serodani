"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Image from "next/image"
import type { Room } from "@/types"
import { ChevronLeft, Loader2 } from "lucide-react"

// არეალის სისტემაში ოთახების ID-ები
const AREALY_ROOM_TYPES: Record<string, string> = {
  'default': '173', // Default Arealy room ID
  // აქ დაამატეთ თქვენი ოთახების მეფინგი
  // თქვენი ოთახის ID: 'Arealy-ის ID'
};

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  room: Room | null
}

export function BookingModal({ isOpen, onClose, room }: BookingModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // მარტივი გადამისამართება Arealy-ს სისტემაზე
  const redirectToArealy = () => {
    if (!room) return;
    
    setLoading(true);
    
    // დღევანდელი და ხვალინდელი თარიღები ნაგულისხმევად
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(today.getDate() + 2);
    
    // ფორმატირება Arealy-სთვის (DD.MM.YYYY)
    const checkInDate = format(tomorrow, "dd.MM.yyyy");
    const checkOutDate = format(dayAfterTomorrow, "dd.MM.yyyy");
    
    // ოთახის ID-ის მოძიება Arealy-სთვის
    const roomTypeId = AREALY_ROOM_TYPES[room.id] || AREALY_ROOM_TYPES.default;
    
    // გადამისამართება
    router.push(`/booking?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&roomType=${roomTypeId}`);
  };
  
  if (!room) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-gray-100 border border-gray-300">
        <DialogHeader className="p-6 bg-serodani text-white">
          {/* სეროდანის ლოგო ზედა მარჯვენა კუთხეში */}
          <div className="absolute top-2 right-8 h-16 w-16">
            <Image 
              src="/logo.jpg" 
              alt="Hotel Logo" 
              width={64}
              height={64}
              className="rounded-full"
            />
          </div>
          
          <DialogTitle className="text-2xl font-serif">
            Book Your Stay
          </DialogTitle>
        </DialogHeader>
        
        {/* მარტივი შემცველი გვერდის ნაცვლად */}
        <div className="p-6 text-center">
          <div className="mb-6">
            <div className="relative aspect-video overflow-hidden rounded-lg border-2 border-gray-300 shadow-md max-w-md mx-auto mb-4">
              <Image
                src={room.imageUrl}
                alt={room.name}
                fill
                className="object-cover"
              />
            </div>

            <h3 className="text-xl font-bold mb-2 text-serodani">{room.name}</h3>
            <p className="text-gray-600 mb-4">{room.description}</p>
              </div>
                
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 max-w-md mx-auto">
            <p className="mb-4">
              გადამისამართდებით Arealy-ს დაჯავშნის სისტემაზე, სადაც შეგიძლიათ აირჩიოთ თარიღები და დააჯავშნოთ ოთახი.
            </p>
            
                <Button 
              onClick={redirectToArealy} 
                  className="w-full bg-gray-600 hover:bg-gray-700"
              disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  გთხოვთ მოითმინოთ...
                    </>
                  ) : (
                "გადასვლა ჯავშნის სისტემაზე"
                  )}
                </Button>
            
                <Button
                  variant="outline"
              className="w-full mt-3" 
              onClick={onClose}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              უკან დაბრუნება
                </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 