"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { uploadImage, addRoom } from "@/lib/upload-utils"
import { Loader2, XCircle, ArrowUp, ArrowDown, Plus, Minus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface RoomFormProps {
  onRoomAdded?: () => void
}

interface ImageFile {
  file: File
  preview: string
  position: number
}

export function RoomForm({ onRoomAdded }: RoomFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [beds, setBeds] = useState("2") // ნაგულისხმევად 2 საწოლი
  const [extraBeds, setExtraBeds] = useState("0") // ნაგულისხმევად 0 დამატებითი საწოლი
  const [minBookingBeds, setMinBookingBeds] = useState("1") // ნაგულისხმევად მინიმუმ 1 საწოლი
  const [images, setImages] = useState<ImageFile[]>([])
  const [bedPrices, setBedPrices] = useState<{ beds: number; price: number }[]>([]) // საწოლების ფასები
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setSuccess(false)

    if (e.target.files && e.target.files.length > 0) {
      const newImages: ImageFile[] = []
      
      Array.from(e.target.files).forEach(file => {
        // Create preview
        const objectUrl = URL.createObjectURL(file)
        // Position is determined by current length of images array
        newImages.push({
          file,
          preview: objectUrl,
          position: images.length + newImages.length
        })
      })
      
      setImages([...images, ...newImages])
    }
    
    // Clear file input for future selections
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }
  
  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    // უნდა განვაახლოთ დარჩენილი სურათების პოზიციები
    const reorderedImages = updatedImages.map((img, i) => ({
      ...img,
      position: i
    }))
    setImages(reorderedImages)
  }
  
  const moveImageUp = (index: number) => {
    if (index === 0) return // პირველი სურათი უკვე პირველ პოზიციაზეა
    
    const updatedImages = [...images]
    // გავცვალოთ მიმდინარე სურათი წინა სურათთან
    const temp = updatedImages[index]
    updatedImages[index] = updatedImages[index - 1]
    updatedImages[index - 1] = temp
    
    // განვაახლოთ პოზიციები
    const reorderedImages = updatedImages.map((img, i) => ({
      ...img,
      position: i
    }))
    
    setImages(reorderedImages)
  }
  
  const moveImageDown = (index: number) => {
    if (index === images.length - 1) return // ბოლო სურათი უკვე ბოლო პოზიციაზეა
    
    const updatedImages = [...images]
    // გავცვალოთ მიმდინარე სურათი შემდეგ სურათთან
    const temp = updatedImages[index]
    updatedImages[index] = updatedImages[index + 1]
    updatedImages[index + 1] = temp
    
    // განვაახლოთ პოზიციები
    const reorderedImages = updatedImages.map((img, i) => ({
      ...img,
      position: i
    }))
    
    setImages(reorderedImages)
  }

  // ახალი საწოლი-ფასის წყვილის დამატება
  const addBedPrice = () => {
    // ვიპოვოთ უმაღლესი შესაძლებელი საწოლების რაოდენობა (ძირითადი + დამატებითი)
    const maxPossibleBeds = Number.parseInt(beds) + Number.parseInt(extraBeds);
    const minPossibleBeds = Number.parseInt(minBookingBeds);
    
    // თუ ყველა შესაძლო საწოლის ვარიანტი უკვე დამატებულია
    const existingBedNumbers = bedPrices.map(bp => bp.beds);
    
    // ვიპოვოთ პირველი ხელმისაწვდომი საწოლების რაოდენობა
    let nextBedNumber = minPossibleBeds;
    while (existingBedNumbers.includes(nextBedNumber) && nextBedNumber <= maxPossibleBeds) {
      nextBedNumber++;
    }
    
    if (nextBedNumber <= maxPossibleBeds) {
      // ვიპოვოთ ნაგულისხმევი ფასი ახალი საწოლისთვის
      let suggestedPrice = Number.parseFloat(price) || 0;
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (images.length === 0) {
        setError("გთხოვთ, აირჩიოთ მინიმუმ ერთი ფოტო ოთახისთვის")
        setLoading(false)
        return
      }

      if (!name || !price) {
        setError("გთხოვთ, შეავსოთ აუცილებელი ველები (სახელი და ფასი)")
        setLoading(false)
        return
      }
      
      // საწოლების რაოდენობის ვალიდაცია
      const bedsNum = Number.parseInt(beds);
      const extraBedsNum = Number.parseInt(extraBeds);
      const minBookingBedsNum = Number.parseInt(minBookingBeds);
      
      if (isNaN(bedsNum) || bedsNum < 1) {
        setError("საწოლების რაოდენობა უნდა იყოს მინიმუმ 1")
        setLoading(false)
        return
      }
      
      // ვამოწმებთ, რომ მინიმალური დასაჯავშნი საწოლების რაოდენობა არ აღემატებოდეს ძირითადი საწოლების რაოდენობას
      if (minBookingBedsNum > bedsNum) {
        setError(`მინიმალური დასაჯავშნი საწოლების რაოდენობა (${minBookingBedsNum}) არ უნდა აღემატებოდეს ძირითადი საწოლების რაოდენობას (${bedsNum})`)
        setLoading(false)
        return
      }
      
      // შევამოწმოთ საწოლების რაოდენობები
      if (bedPrices.length > 0) {
        const maxPossibleBeds = bedsNum + extraBedsNum;
        
        // შევამოწმოთ საწოლების რაოდენობები
        const invalidBeds = bedPrices.some(bp => {
          return isNaN(bp.beds) || 
            bp.beds < minBookingBedsNum || 
            bp.beds > maxPossibleBeds;
        });
        
        if (invalidBeds) {
          setError("საწოლების რაოდენობა უნდა იყოს მინიმუმ " + 
            minBookingBedsNum + 
            " და მაქსიმუმ " + maxPossibleBeds);
          setLoading(false);
          return;
        }
        
        // შევამოწმოთ დუბლიკატები საწოლების რაოდენობაში
        const bedNumbers = bedPrices.map(bp => bp.beds);
        const uniqueBeds = new Set(bedNumbers);
        if (bedNumbers.length !== uniqueBeds.size) {
          setError("საწოლების რაოდენობა არ უნდა მეორდებოდეს");
          setLoading(false);
          return;
        }
      }

      // Upload all images
      const uploadedImages = []
      for (let i = 0; i < images.length; i++) {
        const imageUrl = await uploadImage(images[i].file, "rooms")
        uploadedImages.push({
          url: imageUrl,
          position: images[i].position
        })
      }
      
      // მთავარი სურათი იქნება პირველი (position = 0)
      const mainImageUrl = uploadedImages.find(img => img.position === 0)?.url || uploadedImages[0].url

      // ახალი ოთახი ყოველთვის პირველ პოზიციაზე იქნება, 
      // სხვა ოთახების გადანომრვა მოხდება fetchRooms-ის დროს
      
      // დავალაგოთ bedPrices საწოლების რაოდენობის მიხედვით
      const sortedBedPrices = [...bedPrices].sort((a, b) => a.beds - b.beds);
      
      // Add the room to Firestore
      await addRoom({
        name,
        description,
        price: Number.parseFloat(price),
        beds: Number.parseInt(beds),
        extraBeds: Number.parseInt(extraBeds),
        minBookingBeds: Number.parseInt(minBookingBeds),
        imageUrl: mainImageUrl,
        images: uploadedImages,
        position: 0, // ახალი ოთახი ყოველთვის პირველ პოზიციაზე გამოჩნდება
        bedPrices: sortedBedPrices.length > 0 ? sortedBedPrices : undefined
      })

      // Reset form
      setName("")
      setDescription("")
      setPrice("")
      setBeds("2")
      setExtraBeds("0")
      setMinBookingBeds("1")
      setBedPrices([])
      
      // გავაუქმოთ ყველა preview URL
      images.forEach(img => URL.revokeObjectURL(img.preview))
      setImages([])

      setSuccess(true)
      toast({
        title: "წარმატება",
        description: `ოთახი "${name}" წარმატებით დაემატა.`,
      })
      
      // Call the callback if provided
      if (onRoomAdded) {
        onRoomAdded()
      }
    } catch (err) {
      setError("შეცდომა ოთახის დამატებისას. გთხოვთ, სცადოთ თავიდან.")
      console.error(err)
      toast({
        title: "შეცდომა",
        description: "ოთახის დამატება ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-2">ახალი ოთახის დამატება</h3>
      <p className="text-gray-600 mb-4">შექმენით ახალი ოთახი დეტალებით და სურათებით</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="room-name" className="block mb-2">
            ოთახის სახელი
          </Label>
          <Input
            id="room-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="სტანდარტული ორადგილიანი ოთახი"
            required
          />
        </div>

        <div>
          <Label htmlFor="room-description" className="block mb-2">
            აღწერა (არააუცილებელი)
          </Label>
          <Textarea
            id="room-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="კომფორტული ოთახი ორადგილიანი საწოლით და მთის ხედით..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="room-price" className="block mb-2">
              ფასი (ლარი)
            </Label>
            <Input
              id="room-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="250"
              required
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <Label htmlFor="room-beds" className="block mb-2">
              საწოლების რაოდენობა
            </Label>
            <Input
              id="room-beds"
              type="number"
              value={beds}
              onChange={(e) => setBeds(e.target.value)}
              placeholder="2"
              required
              min="1"
              max="10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="room-extra-beds" className="block mb-2">
              დამატებითი საწოლები
            </Label>
            <Input
              id="room-extra-beds"
              type="number"
              value={extraBeds}
              onChange={(e) => setExtraBeds(e.target.value)}
              placeholder="0"
              min="0"
              max="5"
            />
            <p className="text-xs text-gray-500 mt-1">
              დამატებითი საწოლების რაოდენობა (მაგ: 4+2 extra bed)
            </p>
          </div>
          
          <div>
            <Label htmlFor="room-min-booking-beds" className="block mb-2">
              მინიმალური დასაჯავშნი საწოლები
            </Label>
            <Input
              id="room-min-booking-beds"
              type="number"
              value={minBookingBeds}
              onChange={(e) => setMinBookingBeds(e.target.value)}
              placeholder="1"
              min="1"
              max="10"
            />
            <p className="text-xs text-gray-500 mt-1">
              მინიმუმ რამდენი საწოლის დაჯავშნა არის შესაძლებელი
            </p>
          </div>
        </div>

        {/* საწოლების ფასები */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="room-bed-prices" className="block">
              საწოლების ფასები (არააუცილებელი)
            </Label>
            <Button 
              type="button" 
              size="sm" 
              variant="outline"
              onClick={addBedPrice}
            >
              <Plus className="h-4 w-4 mr-1" /> დამატება
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mb-2">
            შეგიძლიათ მიუთითოთ განსხვავებული ფასები სხვადასხვა რაოდენობის საწოლებისთვის
          </p>
          
          {bedPrices.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              ფასები საწოლების მიხედვით არ არის განსაზღვრული. გამოყენებული იქნება ძირითადი ფასი.
            </p>
          ) : (
            <div className="space-y-2 border rounded-md p-3 bg-gray-50">
              {bedPrices.map((bedPrice, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-20">
                    <Input
                      type="number"
                      value={bedPrice.beds}
                      min={Number.parseInt(minBookingBeds)}
                      max={Number.parseInt(beds) + Number.parseInt(extraBeds)}
                      onChange={(e) => updateBedPriceValue(index, 'beds', parseInt(e.target.value))}
                      className="h-8"
                    />
                  </div>
                  <span className="text-sm">საწოლი</span>
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={bedPrice.price}
                      min={0}
                      step="0.01"
                      onChange={(e) => updateBedPriceValue(index, 'price', parseFloat(e.target.value))}
                      className="h-8"
                    />
                  </div>
                  <span className="text-sm">ლარი</span>
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

        <div>
          <Label htmlFor="room-images" className="block mb-2">
            ოთახის ფოტოები (შეგიძლიათ აირჩიოთ რამდენიმე)
          </Label>
          <Input 
            id="room-images" 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="w-full" 
            multiple 
            ref={fileInputRef}
          />
          <p className="text-xs text-gray-500 mt-1">
            პირველი ფოტო ჩაითვლება მთავარ ფოტოდ. ფოტოების რიგითობის შესაცვლელად გამოიყენეთ ისრები.
          </p>
        </div>

        {/* Preview */}
        {images.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">ფოტოები:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative bg-gray-100 rounded-md overflow-hidden">
                  <img src={img.preview} alt={`ოთახის წინასწარი ხედი ${index + 1}`} className="w-full h-48 object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => removeImage(index)}
                    >
                      <XCircle className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="icon" 
                      className="h-8 w-8" 
                      disabled={index === 0}
                      onClick={() => moveImageUp(index)}
                    >
                      <ArrowUp className="h-5 w-5" />
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="icon" 
                      className="h-8 w-8" 
                      disabled={index === images.length - 1}
                      onClick={() => moveImageDown(index)}
                    >
                      <ArrowDown className="h-5 w-5" />
                    </Button>
                  </div>
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                      მთავარი ფოტო
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">ოთახი წარმატებით დაემატა!</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ოთახის დამატება...
            </>
          ) : (
            "დაამატე ოთახი"
          )}
        </Button>
      </form>
    </div>
  )
}
