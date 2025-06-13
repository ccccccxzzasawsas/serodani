"use client"

import { useState, useEffect } from "react"
import { RoomForm } from "@/components/room-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Room } from "@/types"
import { Trash2, AlertCircle, Images, ArrowUp, ArrowDown, Pencil, CheckCircle2, Settings, Plus, Minus } from "lucide-react"
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
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { toast } from "@/components/ui/use-toast"
import { storage } from "@/lib/firebase"
import { ref, deleteObject, getDownloadURL } from "firebase/storage"
import { UploadForm } from "@/components/upload-form"
import { updateRoomsHeroImage, reorderAllRoomPositions, updateRoomPrice, updateRoomBedPrices } from "@/lib/upload-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

export default function AdminRoomsPage() {
  const [activeTab, setActiveTab] = useState("manage")
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [imagesDialogOpen, setImagesDialogOpen] = useState(false)
  const [heroSuccess, setHeroSuccess] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [heroImage, setHeroImage] = useState("")
  const [loadingHero, setLoadingHero] = useState(true)
  
  // ფასის რედაქტირების state
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null)
  const [newPrice, setNewPrice] = useState("")
  const [updatingPrice, setUpdatingPrice] = useState(false)
  
  // ოთახის პარამეტრების რედაქტირების state
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [newExtraBeds, setNewExtraBeds] = useState("0")
  const [newMinBookingBeds, setNewMinBookingBeds] = useState("1")
  const [updatingSettings, setUpdatingSettings] = useState(false)
  
  // საწოლების ფასების კონფიგურაციის state
  const [bedPricesDialogOpen, setBedPricesDialogOpen] = useState(false)
  const [bedPrices, setBedPrices] = useState<{ beds: number; price: number }[]>([])
  const [updatingBedPrices, setUpdatingBedPrices] = useState(false)

  // ფუნქცია Firebase Storage URL-ის გასაწმენდად და დასაკონვერტირებლად
  const getProperImageUrl = async (url: string): Promise<string | null> => {
    if (!url) return null;
    
    if (url.startsWith('gs://')) {
      try {
        // თუ URL იწყება gs:// ფორმატით, გადავაკონვერტიროთ https:// ფორმატში
        const storageRef = ref(storage, url);
        const httpsUrl = await getDownloadURL(storageRef);
        return httpsUrl;
      } catch (error) {
        console.error("Error converting gs:// URL:", error);
        return null; // შეცდომის შემთხვევაში ვაბრუნებთ null
      }
    }
    
    // არ ვამოწმებთ URL-ის ვალიდურობას
    return url;
  };

  // Process all images in a room to ensure they have proper URLs
  const processRoomImages = async (room: any): Promise<Room> => {
    const processedRoom = {...room};
    
    // Convert main imageUrl if it exists
    if (room.imageUrl) {
      const processedUrl = await getProperImageUrl(room.imageUrl);
      if (processedUrl) {
        processedRoom.imageUrl = processedUrl;
      }
    }
    
    // Process all images in the images array if it exists
    if (room.images && Array.isArray(room.images)) {
      const processedImages = await Promise.all(room.images.map(async (image: any) => {
        if (image.url) {
          const processedUrl = await getProperImageUrl(image.url);
          return {
            ...image,
            url: processedUrl || image.url
          };
        }
        return image;
      }));
      
      processedRoom.images = processedImages;
    }
    
    return processedRoom as Room;
  };

  useEffect(() => {
    fetchRooms()
    fetchHeroImage()
  }, [])

  useEffect(() => {
    // Reset success messages when changing tabs
    setHeroSuccess(false)
  }, [activeTab])

  const fetchHeroImage = async () => {
    try {
      setLoadingHero(true)
      // Hero image
      const heroDoc = await getDoc(doc(db, "sections", "roomsHero"))
      if (heroDoc.exists() && heroDoc.data().imageUrl) {
        const heroUrl = await getProperImageUrl(heroDoc.data().imageUrl);
        if (heroUrl) {
          setHeroImage(heroUrl);
        }
      }
    } catch (error) {
      console.error("Error fetching hero image:", error)
    } finally {
      setLoadingHero(false)
    }
  }

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const roomsCollection = collection(db, "rooms")
      const roomsSnapshot = await getDocs(roomsCollection)

      const roomsList: Room[] = []
      
      // Process each room to ensure all images have proper URLs
      for (const doc of roomsSnapshot.docs) {
        const data = doc.data() as any;
        const processedRoom = await processRoomImages({
          id: doc.id,
          ...data,
          position: data.position || 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        });
        
        roomsList.push(processedRoom);
      }

      // Sort rooms by position first, then by createdAt (for rooms without position)
      const sortedRooms = [...roomsList].sort((a, b) => {
        if (a.position !== undefined && b.position !== undefined) {
          return a.position - b.position
        }
        return b.createdAt.getTime() - a.createdAt.getTime()
      })

      // შევამოწმოთ საჭიროა თუ არა პოზიციების გადანომრვა
      const needsReordering = sortedRooms.some((room, index) => 
        room.position === undefined || room.position !== index
      );

      if (needsReordering && sortedRooms.length > 0) {
        // თანმიმდევრულად გადავანომროთ ყველა ოთახი პოზიციის მიხედვით
        const roomIds = sortedRooms.map(room => room.id);
        await reorderAllRoomPositions(roomIds);
        
        // განვაახლოთ position ველები ლოკალურ ობიექტებშიც
        sortedRooms.forEach((room, index) => {
          room.position = index;
        });
      }

      setRooms(sortedRooms)
    } catch (error) {
      console.error("Error fetching rooms:", error)
      toast({
        title: "შეცდომა",
        description: "ოთახების ჩატვირთვა ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = (room: Room) => {
    setRoomToDelete(room)
    setDeleteDialogOpen(true)
  }

  const showRoomImages = (room: Room) => {
    setSelectedRoom(room)
    setImagesDialogOpen(true)
  }

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return

    setDeleteLoading(true)
    try {
      // Delete document from firestore
      await deleteDoc(doc(db, "rooms", roomToDelete.id))

      // Delete all images from storage
      if (roomToDelete.images && roomToDelete.images.length > 0) {
        for (const image of roomToDelete.images) {
          try {
            // Extract the file path from the URL
            const imageUrl = image.url
            if (imageUrl.includes('firebasestorage.googleapis.com')) {
              // Extract the path after /o/ and before ?
              const pathRegex = /\/o\/(.+?)\?/
              const match = imageUrl.match(pathRegex)
              if (match && match[1]) {
                const filePath = decodeURIComponent(match[1])
                const storageRef = ref(storage, filePath)
                await deleteObject(storageRef)
              }
            }
          } catch (error) {
            console.error("Error deleting image from storage:", error)
          }
        }
      } 
      // თავსებადობისთვის, თუ ძველი ვერსიის ოთახი არის და მხოლოდ imageUrl მოცემული
      else if (roomToDelete.imageUrl) {
        try {
          const imageUrl = roomToDelete.imageUrl
          if (imageUrl.includes('firebasestorage.googleapis.com')) {
            const pathRegex = /\/o\/(.+?)\?/
            const match = imageUrl.match(pathRegex)
            if (match && match[1]) {
              const filePath = decodeURIComponent(match[1])
              const storageRef = ref(storage, filePath)
              await deleteObject(storageRef)
            }
          }
        } catch (error) {
          console.error("Error deleting image from storage:", error)
        }
      }

      // Update local state
      setRooms(rooms.filter(room => room.id !== roomToDelete.id))
      toast({
        title: "წარმატება",
        description: `ოთახი "${roomToDelete.name}" წარმატებით წაიშალა.`,
      })
    } catch (error) {
      console.error("Error deleting room:", error)
      toast({
        title: "შეცდომა",
        description: "ოთახის წაშლა ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
      setDeleteDialogOpen(false)
      setRoomToDelete(null)
    }
  }

  const handleHeroUpload = async (url: string) => {
    try {
      await updateRoomsHeroImage(url)
      setHeroSuccess(true)
      toast({
        title: "წარმატება",
        description: "ოთახების გვერდის მთავარი სურათი წარმატებით განახლდა.",
      })
    } catch (error) {
      console.error("Error updating hero image:", error)
      toast({
        title: "შეცდომა",
        description: "მთავარი სურათის განახლება ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.",
        variant: "destructive",
      })
    }
  }

  const handleRoomAdded = () => {
    fetchRooms()
    setActiveTab("manage")
  }

  const moveRoomUp = async (roomId: string, currentIndex: number) => {
    if (currentIndex === 0) return
    
    try {
      setSaving(roomId)
      const updatedRooms = [...rooms]
      
      // გაცვალეთ ოთახები სიაში
      const temp = updatedRooms[currentIndex]
      updatedRooms[currentIndex] = updatedRooms[currentIndex - 1]
      updatedRooms[currentIndex - 1] = temp
      
      // შევინახოთ ოთახების ID-ები ახალი მიმდევრობით
      const roomIds = updatedRooms.map(room => room.id)
      
      // განვაახლოთ ყველა ოთახის პოზიცია თანმიმდევრული რიცხვებით
      await reorderAllRoomPositions(roomIds)
      
      // განახლდეს UI
      setRooms(updatedRooms)
      
      toast({
        title: "წარმატება",
        description: `ოთახი გადაადგილდა ზევით და პოზიციები განახლდა.`,
      })
    } catch (error) {
      console.error("Error moving room up:", error)
      toast({
        title: "შეცდომა",
        description: "ოთახის გადაადგილება ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.",
        variant: "destructive",
      })
    } finally {
      setSaving(null)
    }
  }
  
  const moveRoomDown = async (roomId: string, currentIndex: number) => {
    if (currentIndex === rooms.length - 1) return
    
    try {
      setSaving(roomId)
      const updatedRooms = [...rooms]
      
      // გაცვალეთ ოთახები სიაში
      const temp = updatedRooms[currentIndex]
      updatedRooms[currentIndex] = updatedRooms[currentIndex + 1]
      updatedRooms[currentIndex + 1] = temp
      
      // შევინახოთ ოთახების ID-ები ახალი მიმდევრობით
      const roomIds = updatedRooms.map(room => room.id)
      
      // განვაახლოთ ყველა ოთახის პოზიცია თანმიმდევრული რიცხვებით
      await reorderAllRoomPositions(roomIds)
      
      // განახლდეს UI
      setRooms(updatedRooms)
      
      toast({
        title: "წარმატება",
        description: `ოთახი გადაადგილდა ქვევით და პოზიციები განახლდა.`,
      })
    } catch (error) {
      console.error("Error moving room down:", error)
      toast({
        title: "შეცდომა",
        description: "ოთახის გადაადგილება ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.",
        variant: "destructive",
      })
    } finally {
      setSaving(null)
    }
  }

  // ფასის რედაქტირების დიალოგის გახსნა
  const openPriceDialog = (room: Room) => {
    setRoomToEdit(room)
    setNewPrice(room.price.toString())
    setPriceDialogOpen(true)
  }

  // ფასის განახლება
  const handleUpdatePrice = async () => {
    if (!roomToEdit) return
    
    const priceValue = parseFloat(newPrice)
    if (isNaN(priceValue) || priceValue < 0) {
      toast({
        title: "შეცდომა",
        description: "გთხოვთ, შეიყვანოთ სწორი ფასი",
        variant: "destructive",
      })
      return
    }
    
    try {
      setUpdatingPrice(true)
      
      // Firestore-ში ფასის განახლება
      await updateRoomPrice(roomToEdit.id, priceValue)
      
      // ლოკალური state-ის განახლება
      setRooms(rooms.map(room => 
        room.id === roomToEdit.id ? { ...room, price: priceValue } : room
      ))
      
      toast({
        title: "წარმატება",
        description: `ოთახის ფასი განახლდა.`,
      })
      
      setPriceDialogOpen(false)
    } catch (error) {
      console.error("Error updating price:", error)
      toast({
        title: "შეცდომა",
        description: "ფასის განახლება ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.",
        variant: "destructive",
      })
    } finally {
      setUpdatingPrice(false)
    }
  }

  // ოთახის პარამეტრების რედაქტირების დიალოგის გახსნა
  const openSettingsDialog = (room: Room) => {
    setRoomToEdit(room)
    setNewExtraBeds((room.extraBeds || 0).toString())
    setNewMinBookingBeds((room.minBookingBeds || 1).toString())
    setSettingsDialogOpen(true)
  }

  // ოთახის პარამეტრების განახლება
  const handleUpdateSettings = async () => {
    if (!roomToEdit) return
    
    const extraBedsValue = parseInt(newExtraBeds)
    const minBookingBedsValue = parseInt(newMinBookingBeds)
    
    if (isNaN(extraBedsValue) || extraBedsValue < 0) {
      toast({
        title: "შეცდომა",
        description: "გთხოვთ, შეიყვანოთ სწორი რაოდენობა დამატებითი საწოლებისთვის",
        variant: "destructive",
      })
      return
    }
    
    if (isNaN(minBookingBedsValue) || minBookingBedsValue < 1) {
      toast({
        title: "შეცდომა",
        description: "მინიმალური დასაჯავშნი საწოლების რაოდენობა უნდა იყოს მინიმუმ 1",
        variant: "destructive",
      })
      return
    }
    
    // ვამოწმებთ, რომ მინიმალური დასაჯავშნი საწოლების რაოდენობა არ აღემატებოდეს ძირითადი საწოლების რაოდენობას
    if (minBookingBedsValue > (roomToEdit.beds || 2)) {
      toast({
        title: "შეცდომა",
        description: `მინიმალური დასაჯავშნი საწოლების რაოდენობა არ უნდა აღემატებოდეს ძირითადი საწოლების რაოდენობას (${roomToEdit.beds})`,
        variant: "destructive",
      })
      return
    }
    
    try {
      setUpdatingSettings(true)
      
      // Firestore-ში პარამეტრების განახლება
      const docRef = doc(db, "rooms", roomToEdit.id)
      await updateDoc(docRef, { 
        extraBeds: extraBedsValue,
        minBookingBeds: minBookingBedsValue
      })
      
      // ლოკალური state-ის განახლება
      setRooms(rooms.map(room => 
        room.id === roomToEdit.id ? { 
          ...room, 
          extraBeds: extraBedsValue,
          minBookingBeds: minBookingBedsValue
        } : room
      ))
      
      toast({
        title: "წარმატება",
        description: `ოთახის პარამეტრები განახლდა.`,
      })
      
      setSettingsDialogOpen(false)
    } catch (error) {
      console.error("Error updating room settings:", error)
      toast({
        title: "შეცდომა",
        description: "პარამეტრების განახლება ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.",
        variant: "destructive",
      })
    } finally {
      setUpdatingSettings(false)
    }
  }

  // საწოლების ფასების რედაქტირების დიალოგის გახსნა
  const openBedPricesDialog = (room: Room) => {
    setRoomToEdit(room)
    // დავაკოპიროთ არსებული ფასები ან შევქმნათ საწყისი ცარიელი მასივი
    setBedPrices(room.bedPrices ? [...room.bedPrices] : [])
    setBedPricesDialogOpen(true)
  }

  // ახალი საწოლი-ფასის წყვილის დამატება
  const addBedPrice = () => {
    // შევამოწმოთ არის თუ არა უკვე ყველა საწოლის ვარიანტი დამატებული
    if (!roomToEdit) return;
    
    // ვიპოვოთ უმაღლესი შესაძლებელი საწოლების რაოდენობა (ძირითადი + დამატებითი)
    const maxPossibleBeds = (roomToEdit.beds || 0) + (roomToEdit.extraBeds || 0);
    
    // თუ ყველა შესაძლო საწოლის ვარიანტი უკვე დამატებულია
    const existingBedNumbers = bedPrices.map(bp => bp.beds);
    
    // ვიპოვოთ პირველი ხელმისაწვდომი საწოლების რაოდენობა
    let nextBedNumber = roomToEdit.minBookingBeds || 1;
    while (existingBedNumbers.includes(nextBedNumber) && nextBedNumber <= maxPossibleBeds) {
      nextBedNumber++;
    }
    
    if (nextBedNumber <= maxPossibleBeds) {
      // ვიპოვოთ ნაგულისხმევი ფასი ახალი საწოლისთვის
      let suggestedPrice = roomToEdit.price;
      
      // თუ უკვე გვაქვს ფასები, შეგვიძლია გამოვიყენოთ ბოლო ფასი როგორც საწყისი
      if (bedPrices.length > 0) {
        // ვსორტავთ მასივს საწოლების რაოდენობის მიხედვით
        const sortedPrices = [...bedPrices].sort((a, b) => a.beds - b.beds);
        // ვიღებთ ბოლო (უდიდესი საწოლების რაოდენობის) ფასს
        suggestedPrice = sortedPrices[sortedPrices.length - 1].price;
      }
      
      setBedPrices([...bedPrices, { beds: nextBedNumber, price: suggestedPrice }]);
    }
  }

  // საწოლი-ფასის წყვილის წაშლა
  const removeBedPrice = (index: number) => {
    const updatedPrices = [...bedPrices];
    updatedPrices.splice(index, 1);
    setBedPrices(updatedPrices);
  }

  // საწოლი-ფასის წყვილის განახლება
  const updateBedPriceValue = (index: number, field: 'beds' | 'price', value: number) => {
    const updatedPrices = [...bedPrices];
    updatedPrices[index][field] = value;
    setBedPrices(updatedPrices);
  }

  // საწოლების ფასების განახლება
  const handleUpdateBedPrices = async () => {
    if (!roomToEdit) return;
    
    // შევამოწმოთ ფასები
    const invalidPrice = bedPrices.some(bp => isNaN(bp.price) || bp.price < 0);
    if (invalidPrice) {
      toast({
        title: "შეცდომა",
        description: "გთხოვთ, შეიყვანოთ სწორი ფასები",
        variant: "destructive",
      });
      return;
    }
    
    // შევამოწმოთ საწოლების რაოდენობები
    const invalidBeds = bedPrices.some(bp => {
      return isNaN(bp.beds) || 
        bp.beds < (roomToEdit.minBookingBeds || 1) || 
        bp.beds > ((roomToEdit.beds || 0) + (roomToEdit.extraBeds || 0));
    });
    
    if (invalidBeds) {
      toast({
        title: "შეცდომა",
        description: "საწოლების რაოდენობა უნდა იყოს მინიმუმ " + 
          (roomToEdit.minBookingBeds || 1) + 
          " და მაქსიმუმ " + 
          ((roomToEdit.beds || 0) + (roomToEdit.extraBeds || 0)),
        variant: "destructive",
      });
      return;
    }
    
    // შევამოწმოთ დუბლიკატები საწოლების რაოდენობაში
    const bedNumbers = bedPrices.map(bp => bp.beds);
    const uniqueBeds = new Set(bedNumbers);
    if (bedNumbers.length !== uniqueBeds.size) {
      toast({
        title: "შეცდომა",
        description: "საწოლების რაოდენობა არ უნდა მეორდებოდეს",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setUpdatingBedPrices(true);
      
      // დავალაგოთ ფასები საწოლების რაოდენობის მიხედვით
      const sortedPrices = [...bedPrices].sort((a, b) => a.beds - b.beds);
      
      // Firestore-ში ფასების განახლება
      await updateRoomBedPrices(roomToEdit.id, sortedPrices);
      
      // ლოკალური state-ის განახლება
      setRooms(rooms.map(room => 
        room.id === roomToEdit.id ? { ...room, bedPrices: sortedPrices } : room
      ));
      
      toast({
        title: "წარმატება",
        description: `საწოლების ფასები განახლდა.`,
      });
      
      setBedPricesDialogOpen(false);
    } catch (error) {
      console.error("Error updating bed prices:", error);
      toast({
        title: "შეცდომა",
        description: "ფასების განახლება ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.",
        variant: "destructive",
      });
    } finally {
      setUpdatingBedPrices(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">ოთახების მართვა</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="manage">არსებული ოთახები</TabsTrigger>
          <TabsTrigger value="add">ახალი ოთახის დამატება</TabsTrigger>
          <TabsTrigger value="hero">მთავარი სურათი</TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>არსებული ოთახები</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">ოთახები იტვირთება...</p>
              ) : rooms.length === 0 ? (
                <p className="text-gray-500">ოთახები არ მოიძებნა. დაამატეთ პირველი ოთახი!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rooms.map((room, index) => (
                    <Card key={room.id} className="overflow-hidden">
                      <div className="relative h-48">
                        <img
                          src={room.imageUrl || "/placeholder.svg?height=192&width=384&text=Room"}
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 flex space-x-2">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => showRoomImages(room)}
                            className="bg-black/50 hover:bg-black/70 text-white"
                          >
                            <Images className="h-4 w-4 mr-1" />
                            {room.images?.length || 1} ფოტო
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold">{room.name}</h3>
                          <div className="flex items-center gap-1">
                          <p className="text-green-600 font-medium">{room.price} ლარი</p>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => openPriceDialog(room)}
                            >
                              <Pencil className="h-3 w-3 text-gray-500" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{room.description}</p>
                        <div className="flex flex-col gap-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span>საწოლები:</span>
                            <span className="font-medium">{room.beds}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>დამატებითი საწოლები:</span>
                            <span className="font-medium">{room.extraBeds || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>მინ. დასაჯავშნი:</span>
                            <span className="font-medium">{room.minBookingBeds || 1}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openSettingsDialog(room)}
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              პარამეტრები
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openBedPricesDialog(room)}
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              ფასები
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <div className="flex space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => moveRoomUp(room.id, index)}
                              disabled={index === 0 || saving === room.id}
                              className="h-9 px-2"
                            >
                              {saving === room.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                              ) : (
                                <ArrowUp className="h-4 w-4" />
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => moveRoomDown(room.id, index)}
                              disabled={index === rooms.length - 1 || saving === room.id}
                              className="h-9 px-2"
                            >
                              {saving === room.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => confirmDelete(room)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            წაშლა
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <RoomForm onRoomAdded={handleRoomAdded} />
        </TabsContent>

        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>ოთახების გვერდის მთავარი სურათი</CardTitle>
              <p className="text-sm text-gray-500">ეს სურათი გამოჩნდება ოთახების გვერდზე მთავარ განყოფილებაში.</p>
            </CardHeader>
            <CardContent>
              {heroSuccess && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">მთავარი სურათი განახლდა!</AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-2">მიმდინარე სურათი</h3>
                  <div className="relative h-64 bg-gray-100 rounded-md overflow-hidden">
                    {loadingHero ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-400"></div>
                      </div>
                    ) : heroImage ? (
                      <img src={heroImage} alt="Current Hero" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        სურათი არ არის ატვირთული
                      </div>
                    )}
                  </div>
                </div>

                <UploadForm
                  title="ატვირთეთ ახალი სურათი"
                  description="რეკომენდებულია მაღალი რეზოლუციის (მინიმუმ 1920x1080) სურათი."
                  path="roomsHero"
                  onUploadComplete={handleHeroUpload}
                  previewHeight={250}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              ოთახის წაშლა
            </DialogTitle>
            <DialogDescription>
              დარწმუნებული ხართ, რომ გსურთ წაშალოთ "{roomToDelete?.name}"? ეს ქმედება ვერ იქნება გაუქმებული.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              გაუქმება
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteRoom}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent"></div>
                  იშლება...
                </>
              ) : (
                'წაშლა'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Images Dialog */}
      <Dialog open={imagesDialogOpen} onOpenChange={setImagesDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedRoom?.name} - ფოტოები</DialogTitle>
            <DialogDescription>
              ოთახის ყველა ფოტო
            </DialogDescription>
          </DialogHeader>
          
          {selectedRoom && (
            <div className="mt-4">
              <Carousel className="w-full">
                <CarouselContent>
                  {selectedRoom.images && selectedRoom.images.length > 0 ? (
                    selectedRoom.images
                      .sort((a, b) => a.position - b.position)
                      .map((image, index) => (
                        <CarouselItem key={index}>
                          <div className="p-1">
                            <div className="relative rounded-lg overflow-hidden aspect-square">
                              <img 
                                src={image.url} 
                                alt={`${selectedRoom.name} - ფოტო ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                ფოტო {index + 1} / {selectedRoom.images.length}
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      ))
                  ) : (
                    <CarouselItem>
                      <div className="p-1">
                        <div className="relative rounded-lg overflow-hidden aspect-square">
                          <img 
                            src={selectedRoom.imageUrl} 
                            alt={selectedRoom.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </CarouselItem>
                  )}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setImagesDialogOpen(false)}>
              დახურვა
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ფასის რედაქტირების დიალოგი */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ფასის რედაქტირება</DialogTitle>
            <DialogDescription>
              შეცვალეთ ოთახის "{roomToEdit?.name}" ფასი
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-6">
            <Label htmlFor="price">ახალი ფასი (ლარი)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="mt-2"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPriceDialogOpen(false)}
              disabled={updatingPrice}
            >
              გაუქმება
            </Button>
            <Button
              onClick={handleUpdatePrice}
              disabled={updatingPrice}
            >
              {updatingPrice ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent"></div>
                  მიმდინარეობს განახლება...
                </>
              ) : (
                'განახლება'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ოთახის პარამეტრების რედაქტირების დიალოგი */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ოთახის პარამეტრები</DialogTitle>
            <DialogDescription>
              შეცვალეთ ოთახის "{roomToEdit?.name}" პარამეტრები
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-6 space-y-4">
            <div>
              <Label htmlFor="extra-beds">დამატებითი საწოლები</Label>
              <Input
                id="extra-beds"
                type="number"
                min="0"
                value={newExtraBeds}
                onChange={(e) => setNewExtraBeds(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                დამატებითი საწოლების რაოდენობა (მაგ: 4+2 extra bed)
              </p>
            </div>
            
            <div>
              <Label htmlFor="min-booking-beds">მინიმალური დასაჯავშნი საწოლები</Label>
              <Input
                id="min-booking-beds"
                type="number"
                min="1"
                value={newMinBookingBeds}
                onChange={(e) => setNewMinBookingBeds(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                მინიმუმ რამდენი საწოლის დაჯავშნა არის შესაძლებელი
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSettingsDialogOpen(false)}
              disabled={updatingSettings}
            >
              გაუქმება
            </Button>
            <Button
              onClick={handleUpdateSettings}
              disabled={updatingSettings}
            >
              {updatingSettings ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent"></div>
                  მიმდინარეობს განახლება...
                </>
              ) : (
                'განახლება'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* საწოლების ფასების დიალოგი */}
      <Dialog open={bedPricesDialogOpen} onOpenChange={setBedPricesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>საწოლების ფასების კონფიგურაცია</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {roomToEdit && (
              <div className="mb-4">
                <h3 className="font-medium">{roomToEdit.name}</h3>
                <p className="text-sm text-gray-500">
                  საწოლები: {roomToEdit.beds}, 
                  დამატებითი: {roomToEdit.extraBeds || 0}, 
                  მინ. დასაჯავშნი: {roomToEdit.minBookingBeds || 1}
                </p>
                <p className="text-sm text-gray-500">
                  ძირითადი ფასი: {roomToEdit.price} ლარი
                </p>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>საწოლების მიხედვით ფასები</Label>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={addBedPrice}
                >
                  <Plus className="h-4 w-4 mr-1" /> დამატება
                </Button>
              </div>
              
              {bedPrices.length === 0 ? (
                <p className="text-sm text-gray-500">
                  ფასები საწოლების მიხედვით არ არის კონფიგურირებული. გამოყენებული იქნება ძირითადი ფასი.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {bedPrices.map((bedPrice, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-24">
                        <Input
                          type="number"
                          value={bedPrice.beds}
                          min={roomToEdit?.minBookingBeds || 1}
                          max={(roomToEdit?.beds || 0) + (roomToEdit?.extraBeds || 0)}
                          onChange={(e) => updateBedPriceValue(index, 'beds', parseInt(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <span>საწოლი</span>
                      <div className="flex-1">
                        <Input
                          type="number"
                          value={bedPrice.price}
                          min={0}
                          onChange={(e) => updateBedPriceValue(index, 'price', parseInt(e.target.value))}
                          className="h-8"
                        />
                      </div>
                      <span>ლარი</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeBedPrice(index)}
                        className="h-8 w-8"
                      >
                        <Minus className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                გაუქმება
              </Button>
            </DialogClose>
            <Button
              onClick={handleUpdateBedPrices}
              disabled={updatingBedPrices}
            >
              {updatingBedPrices ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  მიმდინარეობს...
                </>
              ) : (
                "შენახვა"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
