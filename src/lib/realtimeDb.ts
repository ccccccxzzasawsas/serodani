import { ref, set, get, update, remove, onValue, off, push, child, query, orderByChild, equalTo } from "firebase/database";
import { rtdb } from "./firebase";
import { Booking, Room } from "@/types";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// ჯავშნების შენახვა Realtime Database-ში
export const saveBookingToRealtime = async (booking: Omit<Booking, 'id'>) => {
  try {
    // შევამოწმოთ ამ ჯავშანში მოთხოვნილი რაოდენობის ოთახები არის თუ არა ხელმისაწვდომი
    const roomBookings = await getBookingsByRoomFromRealtime(booking.roomId);
    const activeBookings = roomBookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed');
    
    // შემოწმება - არის თუ არა გადაფარვა თარიღებში
    const hasOverlap = activeBookings.some(existingBooking => {
      // თარიღების გადაფარვის შემოწმება
      const existingStart = new Date(existingBooking.checkInDate);
      const existingEnd = new Date(existingBooking.checkOutDate);
      const newStart = new Date(booking.checkInDate);
      const newEnd = new Date(booking.checkOutDate);
      
      // ორი პერიოდის გადაფარვის სტანდარტული ფორმულა:
      // A-ს საწყისი < B-ს დასასრული AND B-ს საწყისი < A-ს დასასრული
      const overlaps = newStart < existingEnd && existingStart < newEnd;
      
      if (overlaps) {
        console.log(`Booking overlap detected: 
          Existing booking: ${existingBooking.id} (${existingStart.toISOString().split('T')[0]} - ${existingEnd.toISOString().split('T')[0]})
          New booking: (${newStart.toISOString().split('T')[0]} - ${newEnd.toISOString().split('T')[0]})
        `);
      }
      
      return overlaps;
    });
    
    if (hasOverlap) {
      throw new Error("This room is already booked for the selected dates. Please choose different dates.");
    }
    
    // შევქმნათ ახალი ID
    const newBookingRef = push(ref(rtdb, 'bookings'));
    const bookingId = newBookingRef.key;
    
    // დავამატოთ ID და შევინახოთ
    await set(newBookingRef, {
      ...booking,
      id: bookingId,
      // დავრწმუნდეთ რომ სტატუსი არსებობს, თუ არა დავაყენოთ "pending"
      status: booking.status || 'pending',
      createdAt: booking.createdAt.toISOString(),
      checkInDate: booking.checkInDate.toISOString(),
      checkOutDate: booking.checkOutDate.toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return bookingId;
  } catch (error) {
    console.error("Error saving booking to realtime database:", error);
    throw error;
  }
};

// ჯავშნის განახლება
export const updateBookingInRealtime = async (bookingId: string, updates: Partial<Booking>) => {
  try {
    const updatesWithDates: any = { ...updates };
    
    // თარიღების კონვერტაცია
    if (updates.checkInDate instanceof Date) {
      updatesWithDates.checkInDate = updates.checkInDate.toISOString();
    }
    
    if (updates.checkOutDate instanceof Date) {
      updatesWithDates.checkOutDate = updates.checkOutDate.toISOString();
    }
    
    // დავამატოთ განახლების დრო
    updatesWithDates.updatedAt = new Date().toISOString();
    
    await update(ref(rtdb, `bookings/${bookingId}`), updatesWithDates);
    return true;
  } catch (error) {
    console.error("Error updating booking in realtime database:", error);
    throw error;
  }
};

// ჯავშნის წაშლა
export const deleteBookingFromRealtime = async (bookingId: string) => {
  try {
    await remove(ref(rtdb, `bookings/${bookingId}`));
    return true;
  } catch (error) {
    console.error("Error deleting booking from realtime database:", error);
    throw error;
  }
};

// ერთი ჯავშნის წამოღება
export const getBookingFromRealtime = async (bookingId: string): Promise<Booking | null> => {
  try {
    const snapshot = await get(ref(rtdb, `bookings/${bookingId}`));
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        ...data,
        checkInDate: new Date(data.checkInDate),
        checkOutDate: new Date(data.checkOutDate),
        createdAt: new Date(data.createdAt),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error getting booking from realtime database:", error);
    throw error;
  }
};

// ყველა ჯავშნის წამოღება
export const getAllBookingsFromRealtime = async (): Promise<Booking[]> => {
  try {
    const snapshot = await get(ref(rtdb, 'bookings'));
    
    if (snapshot.exists()) {
      const bookings: Booking[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        bookings.push({
          ...data,
          checkInDate: new Date(data.checkInDate),
          checkOutDate: new Date(data.checkOutDate),
          createdAt: new Date(data.createdAt),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        });
      });
      
      // დავალაგოთ შექმნის თარიღის მიხედვით (ახლები პირველები)
      return bookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    
    return [];
  } catch (error) {
    console.error("Error getting all bookings from realtime database:", error);
    throw error;
  }
};

// ოთახის მიხედვით ჯავშნების წამოღება
export const getBookingsByRoomFromRealtime = async (roomId: string): Promise<Booking[]> => {
  try {
    const bookingsQuery = query(
      ref(rtdb, 'bookings'), 
      orderByChild('roomId'), 
      equalTo(roomId)
    );
    
    const snapshot = await get(bookingsQuery);
    
    if (snapshot.exists()) {
      const bookings: Booking[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        bookings.push({
          ...data,
          checkInDate: new Date(data.checkInDate),
          checkOutDate: new Date(data.checkOutDate),
          createdAt: new Date(data.createdAt),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        });
      });
      
      return bookings;
    }
    
    return [];
  } catch (error) {
    console.error("Error getting bookings by room from realtime database:", error);
    throw error;
  }
};

// ჯავშნების რეალურ დროში მოსმენა
export const listenToBookings = (callback: (bookings: Booking[]) => void) => {
  const bookingsRef = ref(rtdb, 'bookings');
  
  const handleSnapshot = (snapshot: any) => {
    if (snapshot.exists()) {
      const bookings: Booking[] = [];
      
      snapshot.forEach((childSnapshot: any) => {
        const data = childSnapshot.val();
        // დავრწმუნდეთ რომ ID არსებობს და დავამატოთ თუ არ არსებობს
        const bookingId = data.id || childSnapshot.key;
        
        try {
          // თარიღების კონვერტაცია და ვალიდაცია
          const checkInDate = data.checkInDate ? new Date(data.checkInDate) : new Date();
          const checkOutDate = data.checkOutDate ? new Date(data.checkOutDate) : new Date();
          const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
          const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
          
          // დავრწმუნდეთ რომ სტატუსი არსებობს, თუ არა დავაყენოთ "pending"
          const status = data.status && ['pending', 'confirmed', 'completed', 'cancelled'].includes(data.status)
            ? data.status
            : 'pending';
          
          bookings.push({
            ...data,
            id: bookingId, // აქ ყოველთვის გვექნება ID, ან თავად ობიექტიდან ან Firebase-ის key
            status, // განახლებული სტატუსი
            checkInDate,
            checkOutDate,
            createdAt,
            updatedAt
          });
        } catch (error) {
          console.error("Error processing booking data:", error, data);
        }
      });
      
      // დავალაგოთ შექმნის თარიღის მიხედვით (ახლები პირველები)
      callback(bookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } else {
      callback([]);
    }
  };
  
  onValue(bookingsRef, handleSnapshot);
  
  // დავაბრუნოთ ფუნქცია, რომელიც გამორთავს მოსმენას
  return () => off(bookingsRef);
};

// კონკრეტული ჯავშნის რეალურ დროში მოსმენა
export const listenToBooking = (bookingId: string, callback: (booking: Booking | null) => void) => {
  const bookingRef = ref(rtdb, `bookings/${bookingId}`);
  
  const handleSnapshot = (snapshot: any) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback({
        ...data,
        checkInDate: new Date(data.checkInDate),
        checkOutDate: new Date(data.checkOutDate),
        createdAt: new Date(data.createdAt),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      });
    } else {
      callback(null);
    }
  };
  
  onValue(bookingRef, handleSnapshot);
  
  // დავაბრუნოთ ფუნქცია, რომელიც გამორთავს მოსმენას
  return () => off(bookingRef);
};

// ოთახის მიხედვით ჯავშნების რეალურ დროში მოსმენა
export const listenToRoomBookings = (roomId: string, callback: (bookings: Booking[]) => void) => {
  const bookingsQuery = query(
    ref(rtdb, 'bookings'), 
    orderByChild('roomId'), 
    equalTo(roomId)
  );
  
  const handleSnapshot = (snapshot: any) => {
    if (snapshot.exists()) {
      const bookings: Booking[] = [];
      
      snapshot.forEach((childSnapshot: any) => {
        const data = childSnapshot.val();
        bookings.push({
          ...data,
          checkInDate: new Date(data.checkInDate),
          checkOutDate: new Date(data.checkOutDate),
          createdAt: new Date(data.createdAt),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        });
      });
      
      callback(bookings);
    } else {
      callback([]);
    }
  };
  
  onValue(bookingsQuery, handleSnapshot);
  
  // დავაბრუნოთ ფუნქცია, რომელიც გამორთავს მოსმენას
  return () => off(bookingsQuery);
};

// ფუნქცია email-ის ენკოდირებისთვის Realtime Database-ში გამოსაყენებლად
export const encodeEmail = (email: string): string => {
  return email.replace(/\./g, ',');
};

// ფუნქცია email-ის დეკოდირებისთვის
export const decodeEmail = (encodedEmail: string): string => {
  return encodedEmail.replace(/,/g, '.');
};

// Firestore-დან მომხმარებლების სინქრონიზაცია Realtime Database-ში
export const syncUsersToRealtimeDatabase = async () => {
  try {
    // წამოვიღოთ ყველა მომხმარებელი Firestore-დან
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    
    // შევქმნათ მომხმარებლების ობიექტი Realtime Database-სთვის
    const usersForRealtime: { [key: string]: any } = {};
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      // მომხმარებელი შეიძლება შენახული იყოს uid-ით ან email-ით
      const userKey = doc.id;
      
      // თარიღების კონვერტაცია
      const createdAt = userData.createdAt?.toDate?.() || new Date();
      const lastLogin = userData.lastLogin?.toDate?.() || new Date();
      
      // შევამოწმოთ თუ key არის email, დავენკოდოთ
      const isEmail = userKey.includes('@');
      const realtimeKey = isEmail ? encodeEmail(userKey) : userKey;
      
      usersForRealtime[realtimeKey] = {
        ...userData,
        createdAt: createdAt.toISOString(),
        lastLogin: lastLogin.toISOString(),
        syncedAt: new Date().toISOString(),
      };
    });
    
    // შევინახოთ მომხმარებლები Realtime Database-ში
    await set(ref(rtdb, 'users'), usersForRealtime);
    
    console.log("Users successfully synced to Realtime Database");
    return true;
  } catch (error) {
    console.error("Error syncing users to realtime database:", error);
    throw error;
  }
};

// Firestore-დან ადმინების სინქრონიზაცია Realtime Database-ში
export const syncAdminsToRealtimeDatabase = async () => {
  try {
    // წამოვიღოთ ყველა ადმინი Firestore-დან
    const adminsCollection = collection(db, "admins");
    const adminsSnapshot = await getDocs(adminsCollection);
    
    // შევქმნათ ადმინების ობიექტი Realtime Database-სთვის
    const adminsForRealtime: { [key: string]: any } = {};
    
    adminsSnapshot.forEach((doc) => {
      const adminData = doc.data();
      // ადმინები შენახულია email-ით
      const adminKey = doc.id;
      
      // მხოლოდ აქტიური ადმინების სინქრონიზაცია
      if (adminData.isAdmin === true) {
        // თარიღების კონვერტაცია
        const createdAt = adminData.createdAt?.toDate?.() || new Date();
        
        // დავენკოდოთ email
        const encodedEmail = encodeEmail(adminKey);
        
        adminsForRealtime[encodedEmail] = {
          ...adminData,
          createdAt: createdAt.toISOString(),
          syncedAt: new Date().toISOString(),
        };
      }
    });
    
    // შევინახოთ ადმინები Realtime Database-ში
    await set(ref(rtdb, 'admins'), adminsForRealtime);
    
    console.log("Admins successfully synced to Realtime Database");
    return true;
  } catch (error) {
    console.error("Error syncing admins to realtime database:", error);
    throw error;
  }
};

// Firestore-დან მომხმარებლებისა და ადმინების სინქრონიზაცია Realtime Database-ში
export const syncAllUsersAndAdminsToRealtimeDatabase = async () => {
  try {
    await syncUsersToRealtimeDatabase();
    await syncAdminsToRealtimeDatabase();
    
    console.log("All users and admins successfully synced to Realtime Database");
    return true;
  } catch (error) {
    console.error("Error syncing users and admins to realtime database:", error);
    throw error;
  }
}; 