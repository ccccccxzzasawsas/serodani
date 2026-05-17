import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "./firebase"
import { getLocalStorageImages } from "./local-images"

export interface GalleryImage {
  id: string
  url: string
  name: string
  width?: number
  height?: number
}

export async function uploadImageToFirebase(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, `gallery/${path}/${file.name}`)
  const snapshot = await uploadBytes(storageRef, file)
  return await getDownloadURL(snapshot.ref)
}

export async function getGalleryImages(path = "gallery"): Promise<GalleryImage[]> {
  return getLocalStorageImages(path).map((url) => {
    const name = url.split("/").pop() || url
    return {
      id: name,
      url,
      name,
    }
  })
}

export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.src = url
  })
}
