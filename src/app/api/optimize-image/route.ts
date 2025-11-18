import { NextRequest, NextResponse } from "next/server"
import { storage } from "@/lib/firebase"
import { ref, getBytes } from "firebase/storage"

export async function POST(request: NextRequest) {
  try {
    const { imagePath } = await request.json()

    if (!imagePath) {
      return NextResponse.json({ error: "Image path is required" }, { status: 400 })
    }

    // Get image bytes from Firebase Storage (server-side, no CORS issues)
    const imageRef = ref(storage, imagePath)
    const bytes = await getBytes(imageRef)

    // Convert bytes to base64
    const base64 = Buffer.from(bytes).toString("base64")
    
    // Determine MIME type from file extension
    const fileExtension = imagePath.split(".").pop()?.toLowerCase() || "jpg"
    const mimeType = 
      fileExtension === "png" ? "image/png" : 
      fileExtension === "webp" ? "image/webp" : 
      "image/jpeg"

    return NextResponse.json({
      success: true,
      data: `data:${mimeType};base64,${base64}`,
      mimeType,
      originalSize: bytes.length,
    })
  } catch (error) {
    console.error("Error fetching image:", error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

