"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { storage } from "@/lib/firebase"
import { ref, listAll, getDownloadURL, uploadBytes, deleteObject, getMetadata, getBytes } from "firebase/storage"
import imageCompression from "browser-image-compression"
import { Loader2, CheckCircle2, XCircle, ImageIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

interface ImageInfo {
  path: string
  url: string
  originalSize: number
  optimizedSize?: number
  status: "pending" | "processing" | "optimized" | "error"
  error?: string
}

export default function OptimizeImagesPage() {
  const { user, isAdmin } = useAuth()
  const [images, setImages] = useState<ImageInfo[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalImages, setTotalImages] = useState(0)
  const [scanLimit, setScanLimit] = useState<string>("")
  const [stats, setStats] = useState({
    total: 0,
    optimized: 0,
    errors: 0,
    totalOriginalSize: 0,
    totalOptimizedSize: 0,
  })

  // Scan all images from Firebase Storage
  const scanAllImages = async () => {
    setIsScanning(true)
    setImages([])
    setStats({
      total: 0,
      optimized: 0,
      errors: 0,
      totalOriginalSize: 0,
      totalOptimizedSize: 0,
    })

    try {
      const folders = ["/gallery", "/home", "/rooms", "/wines", "/dining", "/menu"]
      const allImages: ImageInfo[] = []

      const limit = scanLimit ? parseInt(scanLimit) : undefined

      for (const folder of folders) {
        try {
          const folderRef = ref(storage, folder)
          const result = await listAll(folderRef)

          for (const itemRef of result.items) {
            // Check if we've reached the limit
            if (limit && allImages.length >= limit) {
              break
            }

            try {
              const url = await getDownloadURL(itemRef)
              const metadata = await getMetadata(itemRef)
              const size = metadata.size || 0

              allImages.push({
                path: itemRef.fullPath,
                url,
                originalSize: size,
                status: "pending",
              })
            } catch (error) {
              console.error(`Error processing ${itemRef.fullPath}:`, error)
            }
          }

          // Break outer loop if limit reached
          if (limit && allImages.length >= limit) {
            break
          }
        } catch (error) {
          console.error(`Error scanning folder ${folder}:`, error)
        }
      }

      setImages(allImages)
      setTotalImages(allImages.length)
      setStats((prev) => ({
        ...prev,
        total: allImages.length,
        totalOriginalSize: allImages.reduce((sum, img) => sum + img.originalSize, 0),
      }))
    } catch (error) {
      console.error("Error scanning images:", error)
      alert("შეცდომა ფოტოების სკანირებისას: " + (error as Error).message)
    } finally {
      setIsScanning(false)
    }
  }

  // Optimize a single image
  const optimizeImage = async (imageInfo: ImageInfo): Promise<ImageInfo> => {
    try {
      // Fetch image via API route (server-side, no CORS issues)
      const response = await fetch("/api/optimize-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imagePath: imageInfo.path }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch image")
      }

      const { data: base64Data, mimeType } = await response.json()
      
      // Convert base64 to File
      const fileName = imageInfo.path.split("/").pop() || "image.jpg"
      const fileExtension = fileName.split(".").pop()?.toLowerCase() || "jpg"
      
      // Convert base64 data URL to blob
      const base64String = base64Data.split(",")[1] // Remove data:image/...;base64, prefix
      const binaryString = atob(base64String)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: mimeType })
      const file = new File([blob], fileName, {
        type: mimeType,
      })

      // Compress the image
      const options = {
        maxSizeMB: 0.2, // Maximum size in MB (200KB)
        maxWidthOrHeight: 1920, // Maximum width or height
        useWebWorker: true,
        fileType: fileExtension === "png" ? "image/png" : fileExtension === "webp" ? "image/webp" : "image/jpeg",
        initialQuality: 0.75, // Quality (0-1) - reduced for better compression
      }

      const compressedFile = await imageCompression(file, options)
      const optimizedSize = compressedFile.size

      // Upload optimized image back to Firebase
      const imageRef = ref(storage, imageInfo.path)
      await uploadBytes(imageRef, compressedFile, {
        contentType: compressedFile.type,
      })

      return {
        ...imageInfo,
        optimizedSize,
        status: "optimized" as const,
      }
    } catch (error) {
      console.error(`Error optimizing ${imageInfo.path}:`, error)
      return {
        ...imageInfo,
        status: "error" as const,
        error: (error as Error).message,
      }
    }
  }

  // Optimize all images
  const optimizeAllImages = async () => {
    if (images.length === 0) {
      alert("გთხოვთ ჯერ სკანირება გაუკეთოთ ფოტოებს")
      return
    }

    setIsOptimizing(true)
    setProgress(0)

    const updatedImages: ImageInfo[] = [...images]
    let optimizedCount = 0
    let errorCount = 0
    let totalOptimizedSize = 0

    // Process images one by one to avoid overwhelming the browser
    for (let i = 0; i < updatedImages.length; i++) {
      if (updatedImages[i].status === "pending") {
        updatedImages[i].status = "processing"
        setImages([...updatedImages])

        const result = await optimizeImage(updatedImages[i])
        updatedImages[i] = result

        if (result.status === "optimized") {
          optimizedCount++
          totalOptimizedSize += result.optimizedSize || 0
        } else {
          errorCount++
        }

        setProgress(((i + 1) / updatedImages.length) * 100)
        setImages([...updatedImages])

        // Update stats
        setStats({
          total: images.length,
          optimized: optimizedCount,
          errors: errorCount,
          totalOriginalSize: stats.totalOriginalSize,
          totalOptimizedSize,
        })

        // Small delay to prevent browser freezing
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    setIsOptimizing(false)
    alert(`ოპტიმიზაცია დასრულებულია! ${optimizedCount} ფოტო ოპტიმიზებულია, ${errorCount} შეცდომა.`)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const getSavings = () => {
    if (stats.totalOriginalSize === 0) return 0
    return Math.round(
      ((stats.totalOriginalSize - stats.totalOptimizedSize) / stats.totalOriginalSize) * 100
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">თქვენ არ გაქვთ ადმინისტრატორის უფლებები</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ფოტოების ოპტიმიზაცია</h1>
        <p className="text-gray-600">
          ეს ინსტრუმენტი ყველა ფოტოს Firebase Storage-დან ჩამოვლის და შეამცირებს მათ ზომას,
          ხარისხის დაკარგვის გარეშე.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4 mb-6 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ფოტოების ლიმიტი (დატოვეთ ცარიელი ყველა ფოტოსთვის)
            </label>
            <Input
              type="number"
              placeholder="მაგ: 50 (დატოვეთ ცარიელი ყველასთვის)"
              value={scanLimit}
              onChange={(e) => setScanLimit(e.target.value)}
              disabled={isScanning || isOptimizing}
              min="1"
              className="w-full"
            />
          </div>
          <Button onClick={scanAllImages} disabled={isScanning || isOptimizing}>
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                სკანირება...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                ფოტოების სკანირება
              </>
            )}
          </Button>

          <Button
            onClick={optimizeAllImages}
            disabled={images.length === 0 || isOptimizing || isScanning}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ოპტიმიზაცია... ({Math.round(progress)}%)
              </>
            ) : (
              "ყველა ფოტოს ოპტიმიზაცია"
            )}
          </Button>
        </div>

        {stats.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">სულ ფოტო</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">ოპტიმიზებული</p>
              <p className="text-2xl font-bold text-green-600">{stats.optimized}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">შეცდომები</p>
              <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">დაზოგვა</p>
              <p className="text-2xl font-bold text-blue-600">{getSavings()}%</p>
            </div>
          </div>
        )}

        {stats.totalOriginalSize > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">ორიგინალური ზომა</p>
              <p className="text-xl font-bold">{formatBytes(stats.totalOriginalSize)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">ოპტიმიზებული ზომა</p>
              <p className="text-xl font-bold text-green-600">
                {formatBytes(stats.totalOptimizedSize)}
              </p>
            </div>
          </div>
        )}

        {isOptimizing && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-orange-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {Math.round(progress)}% დასრულებული
            </p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">ფოტოების სია ({images.length})</h2>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{image.path}</p>
                    <div className="flex gap-4 mt-1 text-xs text-gray-600">
                      <span>ორიგინალი: {formatBytes(image.originalSize)}</span>
                      {image.optimizedSize && (
                        <span className="text-green-600">
                          ოპტიმიზებული: {formatBytes(image.optimizedSize)} (
                          {Math.round(
                            ((image.originalSize - image.optimizedSize) / image.originalSize) *
                              100
                          )}
                          % დაზოგვა)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    {image.status === "pending" && (
                      <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                    )}
                    {image.status === "processing" && (
                      <Loader2 className="w-4 h-4 h-4 animate-spin text-orange-500" />
                    )}
                    {image.status === "optimized" && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {image.status === "error" && (
                      <XCircle className="w-5 h-5 text-red-500" title={image.error} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

