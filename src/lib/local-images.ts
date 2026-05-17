import { FIREBASE_STORAGE_IMAGES, type FirebaseStorageImage } from "./firebase-storage-manifest"

type ImageSort = "pathAsc" | "createdAsc" | "createdDesc" | "updatedDesc"

const LOCAL_STORAGE_PREFIX = "/firebase-storage/"

const imagesByPath = new Map(
  FIREBASE_STORAGE_IMAGES.map((image) => [normalizeStoragePath(image.path), image.url]),
)

function normalizeStoragePath(path: string): string {
  return path.replace(/^\/+/, "").replace(/\\/g, "/")
}

function decodeStoragePath(path: string): string {
  let decoded = path

  for (let i = 0; i < 2; i += 1) {
    const next = decodeURIComponent(decoded)
    if (next === decoded) break
    decoded = next
  }

  return normalizeStoragePath(decoded)
}

export function getFirebaseStoragePath(value?: string | null): string | null {
  if (!value) return null

  if (value.startsWith(LOCAL_STORAGE_PREFIX)) {
    return normalizeStoragePath(value.slice(LOCAL_STORAGE_PREFIX.length))
  }

  if (value.startsWith("gs://")) {
    const withoutScheme = value.slice("gs://".length)
    const slashIndex = withoutScheme.indexOf("/")
    return slashIndex === -1 ? null : decodeStoragePath(withoutScheme.slice(slashIndex + 1))
  }

  if (value.includes("firebasestorage.googleapis.com")) {
    try {
      const url = new URL(value)
      const objectMarker = "/o/"
      const objectIndex = url.pathname.indexOf(objectMarker)
      if (objectIndex === -1) return null

      return decodeStoragePath(url.pathname.slice(objectIndex + objectMarker.length))
    } catch {
      return null
    }
  }

  const normalized = normalizeStoragePath(value)
  return imagesByPath.has(normalized) ? normalized : null
}

export function toLocalImageUrl(value?: string | null): string {
  if (!value) return ""

  const storagePath = getFirebaseStoragePath(value)
  if (!storagePath) return value

  return imagesByPath.get(storagePath) || value
}

export function toLocalImageUrls(values?: Array<string | null | undefined> | null): string[] {
  if (!Array.isArray(values)) return []

  return values.map((value) => toLocalImageUrl(value)).filter(Boolean)
}

export function getLocalStorageImages(
  prefix: string,
  options: { recursive?: boolean; sort?: ImageSort } = {},
): string[] {
  const normalizedPrefix = normalizeStoragePath(prefix)
  const prefixWithSlash = normalizedPrefix ? `${normalizedPrefix}/` : ""
  const recursive = options.recursive ?? false

  return FIREBASE_STORAGE_IMAGES
    .filter((image) => isInFolder(image.path, prefixWithSlash, recursive))
    .sort((a, b) => sortImages(a, b, options.sort || "pathAsc"))
    .map((image) => image.url)
}

function isInFolder(path: string, prefixWithSlash: string, recursive: boolean): boolean {
  if (!prefixWithSlash) return true
  if (!path.startsWith(prefixWithSlash)) return false

  const rest = path.slice(prefixWithSlash.length)
  return recursive || !rest.includes("/")
}

function sortImages(a: FirebaseStorageImage, b: FirebaseStorageImage, sort: ImageSort): number {
  switch (sort) {
    case "createdAsc":
      return dateValue(a.timeCreated) - dateValue(b.timeCreated)
    case "createdDesc":
      return dateValue(b.timeCreated) - dateValue(a.timeCreated)
    case "updatedDesc":
      return dateValue(b.updated) - dateValue(a.updated)
    case "pathAsc":
    default:
      return a.path.localeCompare(b.path)
  }
}

function dateValue(value: string): number {
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}
