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
import { getLocalStorageImages, toLocalImageUrl } from './local-images';

// Wine ტიპის განსაზღვრა
export interface Wine {
  id: string;
  name?: string;
  description?: string;
  url: string;
  position?: number;
  createdAt: Date | string;
}

function localizeRoomImages(data: any): { imageUrl: string; images: Room["images"] } {
  const images = Array.isArray(data.images)
    ? data.images.map((image: any, index: number) => ({
        ...image,
        url: toLocalImageUrl(image?.url || image?.imageUrl || ''),
        position: image?.position ?? index,
      }))
    : [];

  const imageUrl = toLocalImageUrl(data.imageUrl || images[0]?.url || '');

  return {
    imageUrl,
    images: images.length > 0 ? images : imageUrl ? [{ url: imageUrl, position: 0 }] : [],
  };
}

function localizeSectionImages(data: any) {
  if (!data) return data;

  return {
    ...data,
    imageUrl: toLocalImageUrl(data.imageUrl || ''),
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls.map((url: string) => toLocalImageUrl(url)) : data.imageUrls,
  };
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
      const localizedImages = localizeRoomImages(data);
      return {
        id: doc.id,
        ...data,
        ...localizedImages,
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
    const localizedImages = localizeRoomImages(data);
    return {
      id: roomDoc.id,
      ...data,
      ...localizedImages,
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
        url: toLocalImageUrl(data.url || ''),
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
 * ღვინის სურათების მიღება მარტივად - მხოლოდ URL-ები
 * ეს ფუნქცია აბრუნებს მხოლოდ წინის სურათების URL-ებს უკვე დამუშავებულ ფორმატში
 */
export async function fetchWineImagesSimple(): Promise<string[]> {
  try {
    return getLocalStorageImages('wines');
    
    // პირდაპირ წამოვიღოთ ყველა ფაილის URL
    
    // ვფილტრავთ null-ებს
  } catch (error) {
    console.error('Error fetching local wine images:', error);
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
        url: toLocalImageUrl(data.url || ''),
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

    return localizeSectionImages(diningDoc.data());
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

/**
 * მთავარი გვერდის სექციების სურათების წამოღება
 */
export async function fetchHomeSectionImages() {
  try {
    // ყველა საჭირო სექციის სია
    const sections = ['hero', 'slider', 'story', 'largePhoto', 'guestReview'];
    
    // პარალელურად წამოვიღოთ ყველა სექციის მონაცემი
    const sectionsData = await Promise.all(
      sections.map(async (sectionName) => {
        try {
          const docRef = doc(db, "sections", sectionName);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            return {
              section: sectionName,
              data: localizeSectionImages(docSnap.data())
            };
          }
          return {
            section: sectionName,
            data: null
          };
        } catch (err) {
          console.error(`Error fetching section ${sectionName}:`, err);
          return {
            section: sectionName,
            data: null,
            error: err
          };
        }
      })
    );
    
    // ობიექტად გარდავქმნათ შედეგები
    const result: Record<string, any> = {};
    
    sectionsData.forEach(item => {
      result[item.section] = item.data;
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching home section images:', error);
    return {};
  }
} 
