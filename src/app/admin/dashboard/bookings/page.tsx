"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { 
  listenToBookings, 
  updateBookingInRealtime, 
  deleteBookingFromRealtime 
} from "@/lib/realtimeDb"
import type { Booking, Room } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Check, X, Info, Trash2 } from "lucide-react"
import { format, isValid } from "date-fns"
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { 
  Badge 
} from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)

  useEffect(() => {
    // გამოვიყენოთ Realtime Database-ის მოსმენა
    const unsubscribe = listenToBookings((realtimeBookings) => {
      console.log("Received bookings from realtime DB:", realtimeBookings);
      // დავრწმუნდეთ რომ ყველა ჯავშანს აქვს ID
      const validBookings = realtimeBookings.filter(booking => {
        if (!booking.id) {
          console.error("Booking without ID detected:", booking);
          return false;
        }
        return true;
      });
      
      setBookings(validBookings);
      setLoading(false);
    });
    
    fetchRooms();
    
    // გავასუფთაოთ მოსმენა კომპონენტის გაუქმებისას
    return () => {
      unsubscribe();
    };
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const bookingsCollection = collection(db, "bookings")
      const bookingsSnapshot = await getDocs(bookingsCollection)

      const bookingsList: Booking[] = []
      bookingsSnapshot.forEach((doc) => {
        const data = doc.data() as any
        
        // თარიღების უკეთესი კონვერტაცია
        let checkInDate, checkOutDate, createdAt;
        
        try {
          checkInDate = data.checkInDate?.toDate ? data.checkInDate.toDate() : new Date(data.checkInDate);
          checkOutDate = data.checkOutDate?.toDate ? data.checkOutDate.toDate() : new Date(data.checkOutDate);
          createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());
          
          // დავრწმუნდეთ, რომ თარიღები ვალიდურია
          if (!isValid(checkInDate)) checkInDate = new Date();
          if (!isValid(checkOutDate)) checkOutDate = new Date();
          if (!isValid(createdAt)) createdAt = new Date();
        } catch (e) {
          console.error("Error converting dates for booking:", doc.id, e);
          checkInDate = new Date();
          checkOutDate = new Date();
          createdAt = new Date();
        }
        
        bookingsList.push({ 
          id: doc.id, 
          ...data, 
          checkInDate,
          checkOutDate,
          createdAt
        })
      })

      // დალაგება თარიღის მიხედვით, ახლები პირველები
      const sortedBookings = [...bookingsList].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setBookings(sortedBookings)
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
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
          beds: data.beds || 2,
          position: data.position || 0, 
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date() 
        })
      })

      setRooms(roomsList)
    } catch (error) {
      console.error("Error fetching rooms:", error)
    }
  }

  const getRoomById = (roomId: string) => {
    return rooms.find(room => room.id === roomId) || null
  }

  const handleShowDetails = (booking: Booking) => {
    console.log("Selected booking:", booking);
    console.log("Selected booking ID:", booking.id);
    if (!booking?.id) {
      console.error("Booking has no ID:", booking);
      toast({
        title: "შეცდომა",
        description: "ჯავშნის ID ვერ მოიძებნა",
        variant: "destructive",
      });
      return;
    }
    setSelectedBooking(booking);
    setDetailsOpen(true);
  }

  const handleDeleteConfirm = (booking: Booking) => {
    setSelectedBooking(booking)
    setConfirmDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedBooking) return

    try {
      // წავშალოთ Firestore-დან
      await deleteDoc(doc(db, "bookings", selectedBooking.id))
      
      // წავშალოთ Realtime Database-დან
      await deleteBookingFromRealtime(selectedBooking.id)
      
      // წავშალოთ ჯავშანი სიადან
      setBookings(bookings.filter(b => b.id !== selectedBooking.id))
      
      toast({
        title: "წარმატება",
        description: "ჯავშანი წარმატებით წაიშალა",
      })
      
      setConfirmDeleteOpen(false)
    } catch (error) {
      console.error("Error deleting booking:", error)
      toast({
        title: "შეცდომა",
        description: "ჯავშნის წაშლა ვერ მოხერხდა",
        variant: "destructive",
      })
    }
  }

  const updateBookingStatus = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      setStatusUpdateLoading(true)
      
      // შევამოწმოთ ვალიდური ID-ა თუ არა
      if (!bookingId) {
        throw new Error("ჯავშნის ID არ არის მითითებული");
      }

      console.log(`Updating status for booking: ${bookingId} to ${newStatus}`);
      
      // შევამოწმოთ, ეს Realtime Database ID-ა (დაწყებული "-"-ით) თუ Firestore ID
      const isRealtimeDbId = bookingId.startsWith("-");

      // თუ ეს არის Firestore ID, განვაახლოთ Firestore-ში
      if (!isRealtimeDbId) {
        try {
          console.log("Updating in Firestore...");
          await updateDoc(doc(db, "bookings", bookingId), {
            status: newStatus
          });
        } catch (err) {
          console.error("Firestore update error:", err);
        }
      }
      
      // ყოველთვის განვაახლოთ Realtime Database-ში
      console.log("Updating in Realtime DB...");
      await updateBookingInRealtime(bookingId, { status: newStatus });
      
      // განვაახლოთ სტატუსი ადგილზე
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
      
      toast({
        title: "წარმატება",
        description: "ჯავშნის სტატუსი წარმატებით განახლდა",
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast({
        title: "შეცდომა",
        description: "სტატუსის განახლება ვერ მოხერხდა",
        variant: "destructive",
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  }

  const getStatusBadge = (status: Booking['status']) => {
    // თუ სტატუსი არ არის მითითებული, გამოვიყენოთ 'pending'
    const bookingStatus = status || 'pending';
    
    switch (bookingStatus) {
      case 'pending':
        return <Badge className="bg-yellow-500">მოლოდინში</Badge>
      case 'confirmed':
        return <Badge className="bg-green-500">დადასტურებული</Badge>
      case 'completed':
        return <Badge className="bg-blue-500">დასრულებული</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500">გაუქმებული</Badge>
      default:
        // თუ უცნობი სტატუსია, ავტომატურად გადავიყვანოთ მოლოდინში
        console.warn(`Unknown booking status: ${status}, defaulting to 'pending'`);
        return <Badge className="bg-yellow-500">მოლოდინში</Badge>
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">ჯავშნების მართვა</h1>
      <p className="text-gray-600 mb-8">ნახეთ და მართეთ კოტეჯების ჯავშნები</p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-blue-500" />
            ყველა ჯავშანი
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">ჯავშნების ჩატვირთვა...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-600">ჯერჯერობით არცერთი ჯავშანი არ არის.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>ჯავშნების სია - სულ {bookings.length} ჯავშანი</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>კოტეჯი</TableHead>
                    <TableHead>სტუმარი</TableHead>
                    <TableHead>შემოსვლა</TableHead>
                    <TableHead>გასვლა</TableHead>
                    <TableHead>საწოლები</TableHead>
                    <TableHead>ჯამი</TableHead>
                    <TableHead>სტატუსი</TableHead>
                    <TableHead className="text-right">მოქმედებები</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.roomName}</TableCell>
                      <TableCell>{booking.guestName}</TableCell>
                      <TableCell>{isValid(booking.checkInDate) ? format(booking.checkInDate, "dd.MM.yyyy") : "არავალიდური თარიღი"}</TableCell>
                      <TableCell>{isValid(booking.checkOutDate) ? format(booking.checkOutDate, "dd.MM.yyyy") : "არავალიდური თარიღი"}</TableCell>
                      <TableCell>{booking.beds}</TableCell>
                      <TableCell>{booking.totalPrice} GEL</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowDetails(booking)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteConfirm(booking)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ჯავშნის დეტალების დიალოგი */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md bg-white shadow-lg border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">ჯავშნის დეტალები</DialogTitle>
            <DialogDescription>
              ჯავშნის სრული ინფორმაცია და სტატუსის მართვა
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">ჯავშნის ID</h3>
                  <p className="text-sm">{selectedBooking.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">შექმნის თარიღი</h3>
                  <p className="text-sm">{format(selectedBooking.createdAt, "dd.MM.yyyy HH:mm")}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">კოტეჯი</h3>
                <p className="text-sm font-medium">{selectedBooking.roomName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">შემოსვლის თარიღი</h3>
                  <p className="text-sm">{isValid(selectedBooking.checkInDate) ? format(selectedBooking.checkInDate, "dd.MM.yyyy") : "არავალიდური თარიღი"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">გასვლის თარიღი</h3>
                  <p className="text-sm">{isValid(selectedBooking.checkOutDate) ? format(selectedBooking.checkOutDate, "dd.MM.yyyy") : "არავალიდური თარიღი"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">საწოლების რაოდენობა</h3>
                  <p className="text-sm">{selectedBooking.beds}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">ჯამური ღირებულება</h3>
                  <p className="text-sm font-bold">{selectedBooking.totalPrice} GEL</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">სტუმრის ინფორმაცია</h3>
                <div className="grid grid-cols-1 gap-1">
                  <p className="text-sm"><span className="font-medium">სახელი:</span> {selectedBooking.guestName}</p>
                  <p className="text-sm"><span className="font-medium">Email:</span> {selectedBooking.guestEmail}</p>
                  {selectedBooking.guestPhone && (
                    <p className="text-sm"><span className="font-medium">ტელეფონი:</span> {selectedBooking.guestPhone}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">სტატუსი</h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedBooking.status)}
                  <Select
                    value={selectedBooking.status}
                    onValueChange={(value) => {
                      // სტატუსის განახლება
                      const bookingId = selectedBooking?.id;
                      console.log("Updating status for booking ID:", bookingId);
                      if (bookingId) {
                        updateBookingStatus(bookingId, value as Booking['status']);
                      } else {
                        console.error("No booking ID available");
                        toast({
                          title: "შეცდომა",
                          description: "ჯავშნის ID ვერ მოიძებნა",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={statusUpdateLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="შეცვალეთ სტატუსი" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">მოლოდინში</SelectItem>
                      <SelectItem value="completed">დასრულებული</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              დახურვა
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* წაშლის დადასტურების დიალოგი */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-white shadow-lg border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">ჯავშნის წაშლა</DialogTitle>
            <DialogDescription>
              ნამდვილად გსურთ წაშალოთ ეს ჯავშანი? ეს მოქმედება ვერ გაუქმდება.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4 py-2">
              <p><span className="font-medium">კოტეჯი:</span> {selectedBooking.roomName}</p>
              <p><span className="font-medium">სტუმარი:</span> {selectedBooking.guestName}</p>
              <p><span className="font-medium">თარიღი:</span> {isValid(selectedBooking.checkInDate) ? format(selectedBooking.checkInDate, "dd.MM.yyyy") : "არავალიდური თარიღი"} - {isValid(selectedBooking.checkOutDate) ? format(selectedBooking.checkOutDate, "dd.MM.yyyy") : "არავალიდური თარიღი"}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              გაუქმება
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              წაშლა
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 