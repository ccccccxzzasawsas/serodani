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
  
  // Photo management state
  const [photoUpdateLoading, setPhotoUpdateLoading] = useState(false)
  const [photoUploadDialogOpen, setPhotoUploadDialogOpen] = useState(false)
  
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

  // Move a room photo up in the order
  const moveRoomPhotoUp = async (photoIndex: number) => {
    if (!selectedRoom || !selectedRoom.images || photoIndex <= 0) return;
    
    setPhotoUpdateLoading(true);
    try {
      // Create a copy of the images array
      const updatedImages = [...selectedRoom.images];
      
      // Swap the current image with the one above it
      const temp = updatedImages[photoIndex];
      updatedImages[photoIndex] = updatedImages[photoIndex - 1];
      updatedImages[photoIndex - 1] = temp;
      
      // Update positions
      const reorderedImages = updatedImages.map((img, i) => ({
        ...img,
        position: i
      }));
      
      // Update the room document in Firestore
      const roomRef = doc(db, "rooms", selectedRoom.id);
      await updateDoc(roomRef, {
        images: reorderedImages
      });
      
      // Update the local state
      setSelectedRoom({
        ...selectedRoom,
        images: reorderedImages
      });
      
      toast({
        title: "წარმატება",
        description: "ფოტოს პოზიცია განახლდა",
      });
    } catch (error) {
      console.error("Error moving photo up:", error);
      toast({
        title: "შეცდომა",
        description: "ფოტოს გადაადგილება ვერ მოხერხდა",
        variant: "destructive",
      });
    } finally {
      setPhotoUpdateLoading(false);
    }
  };
  
  // Move a room photo down in the order
  const moveRoomPhotoDown = async (photoIndex: number) => {
    if (!selectedRoom || !selectedRoom.images || photoIndex >= selectedRoom.images.length - 1) return;
    
    setPhotoUpdateLoading(true);
    try {
      // Create a copy of the images array
      const updatedImages = [...selectedRoom.images];
      
      // Swap the current image with the one below it
      const temp = updatedImages[photoIndex];
      updatedImages[photoIndex] = updatedImages[photoIndex + 1];
      updatedImages[photoIndex + 1] = temp;
      
      // Update positions
      const reorderedImages = updatedImages.map((img, i) => ({
        ...img,
        position: i
      }));
      
      // Update the room document in Firestore
      const roomRef = doc(db, "rooms", selectedRoom.id);
      await updateDoc(roomRef, {
        images: reorderedImages
      });
      
      // Update the local state
      setSelectedRoom({
        ...selectedRoom,
        images: reorderedImages
      });
      
      toast({
        title: "წარმატება",
        description: "ფოტოს პოზიცია განახლდა",
      });
    } catch (error) {
      console.error("Error moving photo down:", error);
      toast({
        title: "შეცდომა",
        description: "ფოტოს გადაადგილება ვერ მოხერხდა",
        variant: "destructive",
      });
    } finally {
      setPhotoUpdateLoading(false);
    }
  };
  
  // Delete a room photo
  const deleteRoomPhoto = async (photoIndex: number) => {
    if (!selectedRoom || !selectedRoom.images) return;
    
    setPhotoUpdateLoading(true);
    try {
      // Create a copy of the images array
      const updatedImages = [...selectedRoom.images];
      const photoToDelete = updatedImages[photoIndex];
      
      // Check if it's the only photo - we can't delete the last photo
      if (updatedImages.length <= 1) {
        toast({
          title: "შეცდომა",
          description: "ბოლო ფოტოს წაშლა არ შეიძლება. ოთახს უნდა ჰქონდეს მინიმუმ ერთი ფოტო.",
          variant: "destructive",
        });
        setPhotoUpdateLoading(false);
        return;
      }
      
      // Remove the photo from the array
      updatedImages.splice(photoIndex, 1);
      
      // Update positions
      const reorderedImages = updatedImages.map((img, i) => ({
        ...img,
        position: i
      }));
      
      // Update the room document in Firestore
      const roomRef = doc(db, "rooms", selectedRoom.id);
      await updateDoc(roomRef, {
        images: reorderedImages,
        // If the first image was deleted, update the main imageUrl to the new first image
        ...(photoIndex === 0 ? { imageUrl: reorderedImages[0].url } : {})
      });
      
      // Try to delete the image from Firebase Storage
      try {
        const imageUrl = photoToDelete.url;
        if (imageUrl.includes('firebasestorage.googleapis.com')) {
          const pathRegex = /\/o\/(.+?)\?/;
          const match = imageUrl.match(pathRegex);
          if (match && match[1]) {
            const filePath = decodeURIComponent(match[1]);
            const storageRef = ref(storage, filePath);
            await deleteObject(storageRef);
          }
        }
      } catch (error) {
        console.error("Error deleting image from storage:", error);
        // Continue anyway as the Firestore document is already updated
      }
      
      // Update the local state
      setSelectedRoom({
        ...selectedRoom,
        images: reorderedImages,
        ...(photoIndex === 0 ? { imageUrl: reorderedImages[0].url } : {})
      });
      
      toast({
        title: "წარმატება",
        description: "ფოტო წაიშალა",
      });
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast({
        title: "შეცდომა",
        description: "ფოტოს წაშლა ვერ მოხერხდა",
        variant: "destructive",
      });
    } finally {
      setPhotoUpdateLoading(false);
    }
  };
  
  // Open photo upload dialog
  const openPhotoUploadDialog = () => {
    setPhotoUploadDialogOpen(true);
  };
  
  // Handle photo upload completion
  const handlePhotoUpload = async (url: string) => {
    if (!selectedRoom) return;
    
    try {
      // Get the current images array
      const currentImages = selectedRoom.images || [];
      
      // Add the new image to the end of the array
      const newImage = {
        url,
        position: currentImages.length
      };
      
      const updatedImages = [...currentImages, newImage];
      
      // Update the room document in Firestore
      const roomRef = doc(db, "rooms", selectedRoom.id);
      await updateDoc(roomRef, {
        images: updatedImages,
        // If this is the first image, also update the main imageUrl
        ...(updatedImages.length === 1 ? { imageUrl: url } : {})
      });
      
      // Update the local state
      setSelectedRoom({
        ...selectedRoom,
        images: updatedImages,
        ...(updatedImages.length === 1 ? { imageUrl: url } : {})
      });
      
      toast({
        title: "წარმატება",
        description: "ფოტო დაემატა",
      });
    } catch (error) {
      console.error("Error adding photo:", error);
      toast({
        title: "შეცდომა",
        description: "ფოტოს დამატება ვერ მოხერხდა",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">ოთახების მართვა</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 bg-white border shadow-sm">
          <TabsTrigger value="manage" className="font-medium">ოთახების სია</TabsTrigger>
          <TabsTrigger value="add" className="font-medium">ოთახის დამატება</TabsTrigger>
          <TabsTrigger value="hero" className="font-medium">Hero სურათი</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="bg-white rounded-lg border shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">ოთახების სია</h2>
          
              {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
              ) : rooms.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 mb-4">ოთახები არ არის დამატებული</p>
              <Button onClick={() => setActiveTab("add")}>
                დაამატე პირველი ოთახი
              </Button>
            </div>
              ) : (
            <div className="space-y-4">
                  {rooms.map((room, index) => (
                <Card key={room.id} className="overflow-hidden border-2 shadow-lg">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-1/3 h-64 relative">
                        <img
                          src={room.imageUrl || (room.images && room.images[0]?.url)}
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2">
                          <p>პოზიცია: {room.position !== undefined ? room.position + 1 : '—'}</p>
                        </div>
                      </div>
                      <div className="w-full md:w-2/3 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold">{room.name}</h3>
                          <div className="text-lg font-semibold text-orange-600">
                            {room.price} ₾
                          </div>
                        </div>
                        
                        <div className="mb-4 text-gray-700">
                          <p>საწოლების რ-ბა: <strong>{room.beds}</strong></p>
                          <p>დამატებითი საწოლები: <strong>{room.extraBeds || 0}</strong></p>
                          <p>მინ. დასაჯავშნი საწოლები: <strong>{room.minBookingBeds || 1}</strong></p>
                        </div>
                        
                        {room.description && (
                          <p className="mb-4 text-gray-700">{room.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => showRoomImages(room)}
                            className="bg-white border-gray-300 hover:bg-gray-100"
                          >
                            <Images className="h-4 w-4 mr-2" />
                            ფოტოები
                          </Button>
                          
                            <Button 
                            variant="outline" 
                            size="sm"
                              onClick={() => openPriceDialog(room)}
                            className="bg-white border-gray-300 hover:bg-gray-100"
                            >
                            <Pencil className="h-4 w-4 mr-2" />
                            ფასის შეცვლა
                            </Button>
                          
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openSettingsDialog(room)}
                            className="bg-white border-gray-300 hover:bg-gray-100"
                            >
                            <Settings className="h-4 w-4 mr-2" />
                              პარამეტრები
                            </Button>
                          
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openBedPricesDialog(room)}
                            className="bg-white border-gray-300 hover:bg-gray-100"
                            >
                            <Settings className="h-4 w-4 mr-2" />
                            საწოლების ფასები
                          </Button>
                          
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => confirmDelete(room)}
                            className="hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            წაშლა
                            </Button>
                          </div>
                        
                        <div className="flex mt-4 gap-2">
                            <Button 
                            variant="secondary"
                              size="sm"
                              onClick={() => moveRoomUp(room.id, index)}
                              disabled={index === 0 || saving === room.id}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                          >
                            <ArrowUp className="h-4 w-4 mr-1" />
                            აწევა
                            </Button>
                            <Button 
                            variant="secondary"
                              size="sm"
                              onClick={() => moveRoomDown(room.id, index)}
                              disabled={index === rooms.length - 1 || saving === room.id}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                          >
                            <ArrowDown className="h-4 w-4 mr-1" />
                            ჩამოწევა
                            </Button>
                          {saving === room.id && (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          )}
                          </div>
                      </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
        </TabsContent>

        <TabsContent value="add" className="bg-white rounded-lg border shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">ოთახის დამატება</h2>
          <RoomForm onRoomAdded={handleRoomAdded} />
        </TabsContent>

        <TabsContent value="hero" className="bg-white rounded-lg border shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">ოთახების Hero სურათი</h2>
          
          <div className="mb-8">
            <Alert className="mb-4 bg-orange-50 border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <AlertDescription>
                ეს სურათი გამოჩნდება ოთახების გვერდის ზედა ნაწილში. რეკომენდებულია ფართო (landscape) ორიენტაციის სურათი.
              </AlertDescription>
                </Alert>

                    {loadingHero ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                      </div>
            ) : (
              <div className="mb-6">
                <div className="rounded-lg overflow-hidden border-2 border-gray-300 shadow-md">
                  {heroImage ? (
                    <img 
                      src={heroImage} 
                      alt="Hero სურათი" 
                      className="w-full h-64 object-cover"
                    />
                    ) : (
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                      <p className="text-gray-500">სურათი არ არის არჩეული</p>
                      </div>
                    )}
                  </div>
                </div>
            )}
            
            {heroSuccess && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  Hero სურათი წარმატებით განახლდა!
                </AlertDescription>
              </Alert>
            )}

                <UploadForm
              title="Hero სურათის ატვირთვა"
              description="აირჩიეთ სურათი ოთახების გვერდის Hero სექციისთვის"
              path="sections"
                  onUploadComplete={handleHeroUpload}
              previewHeight={300}
                />
              </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white border-2 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-red-600">ოთახის წაშლა</DialogTitle>
            <DialogDescription className="text-gray-700">
              დარწმუნებული ხართ, რომ გსურთ ოთახის წაშლა? ეს მოქმედება შეუქცევადია.
            </DialogDescription>
          </DialogHeader>
          
          {roomToDelete && (
            <div className="py-4">
              <p className="font-medium">{roomToDelete.name}</p>
              <p className="text-gray-600">ფასი: {roomToDelete.price} ₾</p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              className="bg-white border-gray-300 hover:bg-gray-100"
            >
              გაუქმება
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteRoom}
              disabled={deleteLoading}
              className="hover:bg-red-700"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  წაშლა...
                </>
              ) : (
                "წაშლა"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Images Dialog */}
      <Dialog open={imagesDialogOpen} onOpenChange={setImagesDialogOpen}>
        <DialogContent className="max-w-4xl bg-white border-2 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">ოთახის ფოტოები - {selectedRoom?.name}</DialogTitle>
            <DialogDescription className="text-gray-700">
              ფოტოების გალერეა ოთახისთვის
            </DialogDescription>
          </DialogHeader>
          
            <div className="mt-4">
            <Button 
              onClick={openPhotoUploadDialog} 
              className="mb-4 bg-orange-500 hover:bg-orange-600 text-white"
            >
              დაამატე ახალი ფოტო
            </Button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedRoom?.images?.map((image, index) => (
                <div key={index} className="relative rounded-md overflow-hidden bg-gray-100 h-48 group border-2 border-gray-300 shadow-md">
                              <img 
                                src={image.url} 
                                alt={`${selectedRoom.name} - ფოტო ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                  <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white bg-opacity-90 hover:bg-opacity-100"
                        onClick={() => moveRoomPhotoUp(index)}
                        disabled={index === 0 || photoUpdateLoading}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white bg-opacity-90 hover:bg-opacity-100"
                        onClick={() => moveRoomPhotoDown(index)}
                        disabled={index === (selectedRoom.images?.length || 0) - 1 || photoUpdateLoading}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white bg-opacity-90 hover:bg-opacity-100 hover:bg-red-100 text-red-600"
                        onClick={() => deleteRoomPhoto(index)}
                        disabled={photoUpdateLoading || (selectedRoom.images?.length || 0) <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                              </div>
                    <div className="bg-black bg-opacity-80 text-white text-sm p-1 rounded">
                      {index === 0 ? "მთავარი ფოტო" : `ფოტო ${index + 1}`}
                            </div>
                          </div>
                        </div>
              ))}
                      </div>
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={photoUploadDialogOpen} onOpenChange={setPhotoUploadDialogOpen}>
        <DialogContent className="bg-white border-2 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">ფოტოს დამატება</DialogTitle>
            <DialogDescription className="text-gray-700">
              აირჩიე ფოტო ასატვირთად
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <UploadForm
              title="ფოტოს ატვირთვა"
              description={`აირჩიეთ ფოტო ოთახისთვის "${selectedRoom?.name}"`}
              path="rooms"
              onUploadComplete={handlePhotoUpload}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Price Edit Dialog */}
      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent className="bg-white border-2 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">ფასის შეცვლა</DialogTitle>
            <DialogDescription className="text-gray-700">
              შეცვალეთ ოთახის ფასი
            </DialogDescription>
          </DialogHeader>
          
          {roomToEdit && (
            <div className="py-4 space-y-4">
              <div>
                <p className="font-medium">{roomToEdit.name}</p>
                <p className="text-gray-600">მიმდინარე ფასი: {roomToEdit.price} ₾</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-price">ახალი ფასი (₾)</Label>
            <Input
                  id="new-price"
              type="number"
              min="0"
                  step="1"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
                  className="border-2 border-gray-300"
            />
          </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setPriceDialogOpen(false)}
              className="bg-white border-gray-300 hover:bg-gray-100"
            >
              გაუქმება
            </Button>
            <Button
              onClick={handleUpdatePrice}
              disabled={updatingPrice}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {updatingPrice ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  განახლება...
                </>
              ) : (
                "განახლება"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="bg-white border-2 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">ოთახის პარამეტრები</DialogTitle>
            <DialogDescription className="text-gray-700">
              შეცვალეთ ოთახის მახასიათებლები
            </DialogDescription>
          </DialogHeader>
          
          {roomToEdit && (
            <div className="py-4 space-y-4">
            <div>
                <p className="font-medium">{roomToEdit.name}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="extra-beds">დამატებითი საწოლების რაოდენობა</Label>
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setNewExtraBeds(Math.max(0, parseInt(newExtraBeds) - 1).toString())}
                    disabled={parseInt(newExtraBeds) <= 0}
                    className="h-8 w-8 bg-white border-gray-300"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
              <Input
                id="extra-beds"
                type="number"
                min="0"
                value={newExtraBeds}
                onChange={(e) => setNewExtraBeds(e.target.value)}
                    className="mx-2 text-center border-2 border-gray-300"
              />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setNewExtraBeds((parseInt(newExtraBeds) + 1).toString())}
                    className="h-8 w-8 bg-white border-gray-300"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
            </div>
            
              <div className="space-y-2">
                <Label htmlFor="min-booking-beds">მინიმალური დასაჯავშნი საწოლების რ-ბა</Label>
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setNewMinBookingBeds(Math.max(1, parseInt(newMinBookingBeds) - 1).toString())}
                    disabled={parseInt(newMinBookingBeds) <= 1}
                    className="h-8 w-8 bg-white border-gray-300"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
              <Input
                id="min-booking-beds"
                type="number"
                min="1"
                value={newMinBookingBeds}
                onChange={(e) => setNewMinBookingBeds(e.target.value)}
                    className="mx-2 text-center border-2 border-gray-300"
              />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setNewMinBookingBeds((parseInt(newMinBookingBeds) + 1).toString())}
                    disabled={parseInt(newMinBookingBeds) >= roomToEdit.beds}
                    className="h-8 w-8 bg-white border-gray-300"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  მინ. საწოლების რ-ბა არ უნდა აღემატებოდეს ძირითადი საწოლების რ-ბას ({roomToEdit.beds})
              </p>
            </div>
          </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSettingsDialogOpen(false)}
              className="bg-white border-gray-300 hover:bg-gray-100"
            >
              გაუქმება
            </Button>
            <Button
              onClick={handleUpdateSettings}
              disabled={updatingSettings}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {updatingSettings ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  განახლება...
                </>
              ) : (
                "განახლება"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bed Prices Dialog */}
      <Dialog open={bedPricesDialogOpen} onOpenChange={setBedPricesDialogOpen}>
        <DialogContent className="bg-white border-2 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">საწოლების ფასები</DialogTitle>
            <DialogDescription className="text-gray-700">
              სხვადასხვა რაოდენობის საწოლებისთვის ფასების კონფიგურაცია
            </DialogDescription>
          </DialogHeader>
          
            {roomToEdit && (
            <div className="py-4 space-y-4">
              <div>
                <p className="font-medium">{roomToEdit.name}</p>
                <p className="text-gray-600">
                  ძირითადი საწოლები: {roomToEdit.beds}, 
                  დამატებითი: {roomToEdit.extraBeds || 0}
                </p>
                <p className="text-gray-600">
                  ძირითადი ფასი: {roomToEdit.price} ₾
                </p>
              </div>
              
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                  <Label>საწოლების ფასები</Label>
                <Button 
                  type="button" 
                  variant="outline"
                    size="sm"
                  onClick={addBedPrice}
                    className="bg-white border-gray-300 hover:bg-gray-100"
                >
                    <Plus className="h-3 w-3 mr-1" />
                    დამატება
                </Button>
              </div>
              
              {bedPrices.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    საწოლების ფასები არ არის დაკონფიგურირებული. 
                    თუ არ დაამატებთ, გამოყენებული იქნება ძირითადი ფასი.
                </p>
              ) : (
                  <div className="space-y-2 border rounded-md p-3 bg-gray-50">
                  {bedPrices.map((bedPrice, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="flex-1">
                          <Label htmlFor={`bed-count-${index}`} className="text-xs">საწოლები</Label>
                        <Input
                            id={`bed-count-${index}`}
                          type="number"
                            min={roomToEdit.minBookingBeds || 1}
                            max={(roomToEdit.beds || 2) + (roomToEdit.extraBeds || 0)}
                          value={bedPrice.beds}
                          onChange={(e) => updateBedPriceValue(index, 'beds', parseInt(e.target.value))}
                            className="border-2 border-gray-300"
                        />
                      </div>
                      <div className="flex-1">
                          <Label htmlFor={`bed-price-${index}`} className="text-xs">ფასი (₾)</Label>
                        <Input
                            id={`bed-price-${index}`}
                          type="number"
                            min="0"
                            step="1"
                          value={bedPrice.price}
                          onChange={(e) => updateBedPriceValue(index, 'price', parseInt(e.target.value))}
                            className="border-2 border-gray-300"
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeBedPrice(index)}
                          className="mt-4 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
                
                <p className="text-sm text-gray-500">
                  შეგიძლიათ დააკონფიგურიროთ სხვადასხვა რაოდენობის საწოლებისთვის სხვადასხვა ფასი.
                </p>
            </div>
          </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setBedPricesDialogOpen(false)}
              className="bg-white border-gray-300 hover:bg-gray-100"
            >
                გაუქმება
              </Button>
            <Button
              onClick={handleUpdateBedPrices}
              disabled={updatingBedPrices}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {updatingBedPrices ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  განახლება...
                </>
              ) : (
                "განახლება"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
