"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format, addDays } from "date-fns"

// რუმების ID-ების მეფინგი Arealy-ს სისტემასთან
export const AREALY_ROOM_TYPES = {
  // მოცემული ID-ები Arealy სისტემიდან
  TWO_BEDROOM_COTTAGE: '1731',   // Two-Bedroom Cottage
  COTTAGE: '1732',               // Cottage
  ONE_BEDROOM_COTTAGE: '1733',   // One-Bedroom Cottage
  FAMILY_ROOM_BALCONY: '1734',   // Family Room with Balcony
  COTTAGE_GARDEN_VIEW: '1735',   // Cottage with Garden View
  LARGE_TWIN_ROOM: '1736',       // Large Twin Room
  
  // ძველი მნიშვნელობა
  STANDARD: '173'
}

// ოთახის სახელის და Arealy ID-ის მეფინგი
export const mapRoomNameToArealyId = (roomName: string): string => {
  // Direct mapping for exact matches
  const nameToIdMap: Record<string, string> = {
    'Two-Bedroom Cottage': AREALY_ROOM_TYPES.TWO_BEDROOM_COTTAGE,     // 1731
    'Cottage': AREALY_ROOM_TYPES.COTTAGE,                            // 1732
    'One-Bedroom Cottage': AREALY_ROOM_TYPES.ONE_BEDROOM_COTTAGE,     // 1733
    'Family Room with Balcony': AREALY_ROOM_TYPES.FAMILY_ROOM_BALCONY, // 1734
    'Cottage with Garden View': AREALY_ROOM_TYPES.COTTAGE_GARDEN_VIEW, // 1735
    'Large Twin Room': AREALY_ROOM_TYPES.LARGE_TWIN_ROOM              // 1736
  };

  // Pattern matching for room types to handle variations
  const patterns = [
    { pattern: /two.*bedroom|two.*bed/i, id: AREALY_ROOM_TYPES.TWO_BEDROOM_COTTAGE },
    { pattern: /^cottage$/i, id: AREALY_ROOM_TYPES.COTTAGE },
    { pattern: /one.*bedroom|one.*bed/i, id: AREALY_ROOM_TYPES.ONE_BEDROOM_COTTAGE },
    { pattern: /family.*balcony|balcony/i, id: AREALY_ROOM_TYPES.FAMILY_ROOM_BALCONY },
    { pattern: /garden.*view|garden/i, id: AREALY_ROOM_TYPES.COTTAGE_GARDEN_VIEW },
    { pattern: /large.*twin|twin.*room/i, id: AREALY_ROOM_TYPES.LARGE_TWIN_ROOM }
  ];

  // Try exact match first (case-insensitive)
  for (const [name, id] of Object.entries(nameToIdMap)) {
    if (name.toLowerCase() === roomName.toLowerCase()) {
      return id;
    }
  }
  
  // Try pattern matching if exact match fails
  for (const { pattern, id } of patterns) {
    if (pattern.test(roomName)) {
      return id;
    }
  }

  // Default
  return AREALY_ROOM_TYPES.STANDARD;
}

interface BookingButtonProps {
  roomTypeId?: string
  roomName?: string // ოთახის სახელის მიხედვით ID-ს მოძებნის პარამეტრი
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  children?: React.ReactNode
  daysFromNow?: number
  stayDuration?: number
}

/**
 * დაჯავშნის ღილაკი Arealy-ს სისტემისთვის
 */
export function BookingButton({ 
  roomTypeId,
  roomName,
  className, 
  variant = "default", 
  children = "დაჯავშნა",
  daysFromNow = 1,
  stayDuration = 1
}: BookingButtonProps) {
  // Debug log to see what roomName is being passed
  console.log("BookingButton received roomName:", roomName);
  
  // ავტომატურად მოვძებნოთ roomTypeId თუ მხოლოდ roomName-ია მოცემული
  const finalRoomTypeId = roomTypeId || (roomName ? mapRoomNameToArealyId(roomName) : AREALY_ROOM_TYPES.STANDARD);
  
  // Debug log to see what ID was resolved
  console.log("Resolved roomTypeId:", finalRoomTypeId);

  // Format dates in DD.MM.YYYY format for Arealy
  // For testing/demo purposes, we could use fixed dates from the example
  // Otherwise use dynamic dates as before
  const useFixedDates = true; // Set to true to use fixed dates from the example
  
  let checkInDate, checkOutDate;
  
  if (useFixedDates) {
    // Fixed dates from example
    checkInDate = "28.07.2025";
    checkOutDate = "29.07.2025";
  } else {
    // Dynamic dates based on current date
    checkInDate = format(addDays(new Date(), daysFromNow), "dd.MM.yyyy")
    checkOutDate = format(addDays(new Date(), daysFromNow + stayDuration), "dd.MM.yyyy")
  }
  
  // Generate booking URL for Arealy
  const bookingUrl = `/booking?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}&roomType=${finalRoomTypeId}`
  
  return (
    <Button asChild variant={variant} className={className}>
      <Link href={bookingUrl}>
        {children}
      </Link>
    </Button>
  )
} 