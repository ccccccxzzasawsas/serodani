import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { 
  STATIC_PAGE_REVALIDATE_TIME, 
  DYNAMIC_DATA_REVALIDATE_TIME, 
  ROOMS_REVALIDATE_TIME,
  WINES_REVALIDATE_TIME,
  GALLERY_REVALIDATE_TIME,
  CACHE_TAGS
} from './cache-config';
import type { Room } from '@/types';

// Wine ტიპის განსაზღვრა
export interface Wine {
  id: string;
  name?: string;
  description?: string;
  url: string;
  position?: number;
  createdAt: Date | string;
}

/**
 * ოთახების მონაცემების მიღება ქეშირებით
 */
export async function fetchRooms(): Promise<Room[]> {
  try {
    // Fetch-ის გამოყენება ქეშირებისთვის
    const roomsSnapshot = await getDocs(collection(db, 'rooms'));
    const rooms = roomsSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        name: data.name || '',
        description: data.description || '',
        price: data.price || 0,
        beds: data.beds || 2,
        totalRooms: data.totalRooms || 1,
        position: data.position || 0,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      } as Room;
    });

    return rooms;
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
}

/**
 * კონკრეტული ოთახის მონაცემების მიღება ქეშირებით
 */
export async function fetchRoom(roomId: string) {
  try {
    const roomDoc = await getDoc(doc(db, 'rooms', roomId));
    
    if (!roomDoc.exists()) {
      return null;
    }

    const data = roomDoc.data();
    return {
      id: roomDoc.id,
      ...data,
      name: data.name || '',
      description: data.description || '',
      price: data.price || 0,
      beds: data.beds || 2,
      totalRooms: data.totalRooms || 1,
      position: data.position || 0,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    } as Room;
  } catch (error) {
    console.error(`Error fetching room ${roomId}:`, error);
    return null;
  }
}

/**
 * ღვინის მონაცემების მიღება ქეშირებით
 */
export async function fetchWines(): Promise<Wine[]> {
  try {
    const winesSnapshot = await getDocs(collection(db, 'wines'));
    const wines = winesSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        name: data.name || '',
        description: data.description || '',
        url: data.url || '',
        position: data.position || 0,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      } as Wine;
    });

    return wines;
  } catch (error) {
    console.error('Error fetching wines:', error);
    return [];
  }
}

/**
 * გალერეის მონაცემების მიღება ქეშირებით
 */
export async function fetchGalleryImages() {
  try {
    const gallerySnapshot = await getDocs(collection(db, 'gallery'));
    const images = gallerySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        url: data.url || '',
        title: data.title || '',
        position: data.position || 0,
      };
    });

    return images;
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return [];
  }
}

/**
 * რესტორნის მონაცემების მიღება ქეშირებით
 */
export async function fetchDiningInfo() {
  try {
    const diningDoc = await getDoc(doc(db, 'pages', 'dining'));
    
    if (!diningDoc.exists()) {
      return null;
    }

    return diningDoc.data();
  } catch (error) {
    console.error('Error fetching dining info:', error);
    return null;
  }
}

/**
 * ჯავშნების მონაცემების მიღება ქეშირებით
 * ეს მონაცემები უფრო დინამიურია, ამიტომ ნაკლები დროით ვინახავთ ქეშში
 */
export async function fetchBookings() {
  try {
    const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
    const bookings = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return bookings;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
} 