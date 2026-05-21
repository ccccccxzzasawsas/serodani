import type { Room } from "@/types"
import { getLocalStorageImages } from "./local-images"

export interface Wine {
  id: string
  name?: string
  description?: string
  url: string
  position?: number
  createdAt: Date | string
}

const ROOM_NAMES = [
  "Two-Bedroom Cottage",
  "Cottage",
  "One-Bedroom Cottage",
  "Family Room with Balcony",
  "Cottage with Garden View",
  "Large Twin Room",
]

const ROOM_DESCRIPTIONS = [
  "A private wooden cottage with space for families or small groups.",
  "A cozy cottage surrounded by fresh air, garden views, and calm countryside.",
  "A comfortable one-bedroom cottage for a quiet Kakheti getaway.",
  "A family-friendly room with a balcony and relaxing outdoor views.",
  "A garden-view cottage made for slow mornings and peaceful evenings.",
  "A bright twin room with comfortable beds and easy access to the hotel grounds.",
]

function splitIntoGroups<T>(items: T[], groupCount: number): T[][] {
  const groups: T[][] = Array.from({ length: groupCount }, () => [])

  items.forEach((item, index) => {
    groups[index % groupCount].push(item)
  })

  return groups
}

export async function fetchRooms(): Promise<Room[]> {
  const roomImages = getLocalStorageImages("rooms", { sort: "createdAsc" })
  const imageGroups = splitIntoGroups(roomImages, ROOM_NAMES.length)

  return ROOM_NAMES.map((name, index) => {
    const images = imageGroups[index] || []
    const imageUrl = images[0] || "/placeholder.svg?height=400&width=600"

    return {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name,
      description: ROOM_DESCRIPTIONS[index],
      price: 0,
      beds: index === 0 ? 4 : 2,
      totalRooms: 1,
      imageUrl,
      images: images.map((url, position) => ({ url, position })),
      position: index,
      createdAt: new Date(0),
    } satisfies Room
  })
}

export async function fetchRoom(roomId: string): Promise<Room | null> {
  const rooms = await fetchRooms()
  return rooms.find((room) => room.id === roomId) || null
}

export async function fetchWines(): Promise<Wine[]> {
  return getLocalStorageImages("wines", { sort: "createdAsc" }).map((url, index) => ({
    id: `wine-${index}`,
    url,
    position: index,
    createdAt: new Date(0),
  }))
}

export async function fetchWineImagesSimple(): Promise<string[]> {
  return getLocalStorageImages("wines", { sort: "createdAsc" })
}

export async function fetchGalleryImages() {
  return getLocalStorageImages("gallery", { sort: "createdDesc" }).map((url, index) => ({
    id: `gallery-${index}`,
    url,
    title: "",
    position: index,
  }))
}

export async function fetchDiningInfo() {
  const hero = getLocalStorageImages("dining-hero", { sort: "updatedDesc" })[0] || ""
  const images = getLocalStorageImages("dining", { sort: "createdDesc" })

  return {
    imageUrl: hero,
    imageUrls: images,
  }
}

export async function fetchBookings() {
  return []
}

export async function fetchHomeSectionImages() {
  return {
    hero: {
      imageUrl: getLocalStorageImages("hero", { sort: "updatedDesc" })[0] || "",
    },
    slider: {
      imageUrls: getLocalStorageImages("slider", { sort: "createdAsc" }),
    },
    story: {
      imageUrls: getLocalStorageImages("story", { sort: "createdAsc" }),
    },
    largePhoto: {
      imageUrl: getLocalStorageImages("largePhoto", { sort: "updatedDesc" })[0] || "",
    },
    guestReview: {
      imageUrl: getLocalStorageImages("guestReview", { sort: "updatedDesc" })[0] || "",
    },
  }
}
