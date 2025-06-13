export interface Room {
  id: string
  name: string
  description?: string // აღწერა არ არის აუცილებელი
  price: number
  beds: number // საწოლების რაოდენობა (ადგილები)
  totalRooms: number // ოთახების რაოდენობა
  extraBeds?: number // დამატებითი საწოლების რაოდენობა
  minBookingBeds?: number // მინიმალური საწოლების რაოდენობა, რომლის დაჯავშნაც შესაძლებელია
  bedPrices?: { beds: number; price: number }[] // საწოლების რაოდენობის მიხედვით ფასები
  imageUrl: string // მთავარი სურათი (თავდაპირველი ვერსიისთვის თავსებადობის შესანარჩუნებლად)
  images: {
    url: string
    position: number // სურათის პოზიცია სლაიდერში
  }[]
  position?: number // ოთახის პოზიცია სიაში
  createdAt: Date
}

export interface Booking {
  id: string
  roomId: string
  roomName: string
  checkInDate: Date
  checkOutDate: Date
  guestName: string
  guestEmail: string
  guestPhone?: string
  beds: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt?: Date
}

export interface GalleryImage {
  id: string
  url: string
  section: string
  caption?: string
  createdAt: Date
}

export interface SectionContent {
  id: string
  imageUrl?: string
  imageUrls?: string[]
  text?: string
  updatedAt: Date
}
