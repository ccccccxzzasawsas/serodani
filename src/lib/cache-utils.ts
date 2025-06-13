import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from './cache-config';

/**
 * ქეშის განახლება კონკრეტული ტაგისთვის
 * @param tag - ქეშის ტაგი, რომლის განახლებაც გვინდა
 */
export async function invalidateCache(tag: string): Promise<void> {
  try {
    revalidateTag(tag);
    console.log(`Cache invalidated for tag: ${tag}`);
  } catch (error) {
    console.error(`Error invalidating cache for tag ${tag}:`, error);
  }
}

/**
 * ოთახების ქეშის განახლება
 */
export async function invalidateRoomsCache(): Promise<void> {
  await invalidateCache(CACHE_TAGS.rooms);
}

/**
 * ღვინების ქეშის განახლება
 */
export async function invalidateWinesCache(): Promise<void> {
  await invalidateCache(CACHE_TAGS.wines);
}

/**
 * გალერეის ქეშის განახლება
 */
export async function invalidateGalleryCache(): Promise<void> {
  await invalidateCache(CACHE_TAGS.gallery);
}

/**
 * რესტორნის ქეშის განახლება
 */
export async function invalidateDiningCache(): Promise<void> {
  await invalidateCache(CACHE_TAGS.dining);
}

/**
 * ჯავშნების ქეშის განახლება
 */
export async function invalidateBookingsCache(): Promise<void> {
  await invalidateCache(CACHE_TAGS.bookings);
}

/**
 * ყველა ქეშის განახლება
 */
export async function invalidateAllCache(): Promise<void> {
  const allTags = Object.values(CACHE_TAGS);
  
  for (const tag of allTags) {
    await invalidateCache(tag);
  }
  
  console.log('All cache invalidated');
} 