import { collection, addDoc, getDocs, query, where, orderBy, getDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import { saveBookingToRealtime, getAllBookingsFromRealtime } from "./realtimeDb";
import { getDatabase, ref, set, push } from "firebase/database";
import { Room } from "@/types";

interface BookingData {
    roomId: string;
    roomName: string;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    checkIn: string; // "YYYY-MM-DD"
    checkOut: string; // "YYYY-MM-DD"
    numberOfRooms: number;
    totalPrice: number;
    country?: string;
    comment?: string;
    extraBedsConfirmed?: boolean;
}

// ფუნქცია, რომელიც ამოწმებს Firestore-ში ჯავშნების გადაფარვას
export const checkFirestoreBookingOverlap = async (
    roomId: string,
    checkIn: Date,
    checkOut: Date
): Promise<boolean> => {
    try {
        // მივიღოთ ყველა ჯავშანი ამ ოთახისთვის (ინდექსის გარეშე)
        const bookingsQuery = query(
            collection(db, "bookings"),
            where("roomId", "==", roomId)
        );
        
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        // შევამოწმოთ არის თუ არა გადაფარვა
        for (const doc of bookingsSnapshot.docs) {
            const booking = doc.data();
            
            // გამოვტოვოთ გაუქმებული და დასრულებული ჯავშნები (ამას კოდში ვამოწმებთ ინდექსის მაგივრად)
            if (booking.status === "cancelled" || booking.status === "completed") {
                continue;
            }
            
            const existingCheckIn = booking.checkIn instanceof Date 
                ? booking.checkIn 
                : new Date(booking.checkIn);
            
            const existingCheckOut = booking.checkOut instanceof Date 
                ? booking.checkOut 
                : new Date(booking.checkOut);
            
            // ორი პერიოდის გადაფარვის სტანდარტული ფორმულა:
            // A-ს საწყისი < B-ს დასასრული AND B-ს საწყისი < A-ს დასასრული
            const overlaps = checkIn < existingCheckOut && existingCheckIn < checkOut;
            
            if (overlaps) {
                console.log(`Firestore booking overlap detected: 
                    Existing booking: ${doc.id} (${existingCheckIn.toISOString().split('T')[0]} - ${existingCheckOut.toISOString().split('T')[0]})
                    New booking: (${checkIn.toISOString().split('T')[0]} - ${checkOut.toISOString().split('T')[0]})
                `);
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error("Error checking Firestore booking overlap:", error);
        // If there's an error with the query, we'll log it but not block the booking
        // This allows bookings to proceed while the index is being created
        return false;
    }
};

export async function createBooking(bookingData: BookingData): Promise<string> {
    const rtdb = getDatabase();
    const bookingsRef = ref(rtdb, "bookings");
    const newBookingRef = push(bookingsRef);
    
    try {
        // მივიღოთ ოთახის მონაცემები, რომ გავიგოთ საწოლების რაოდენობა
        const roomDoc = await getDoc(doc(db, "rooms", bookingData.roomId));
        if (!roomDoc.exists()) {
            throw new Error("Room not found");
        }
        
        const roomData = roomDoc.data();
        const bedsPerRoom = roomData.beds || 2;
        const totalRooms = roomData.totalRooms || 1;
        const totalBeds = bedsPerRoom * totalRooms;
        const extraBeds = roomData.extraBeds || 0;
        const totalBedsWithExtra = totalBeds + extraBeds;
        
        // შევამოწმოთ გადაფარვა Firestore-ში
        try {
            const checkInDate = new Date(bookingData.checkIn);
            const checkOutDate = new Date(bookingData.checkOut);
            const hasFirestoreOverlap = await checkFirestoreBookingOverlap(
                bookingData.roomId,
                checkInDate,
                checkOutDate
            );
            
            if (hasFirestoreOverlap) {
                throw new Error("This room is already booked for the selected dates in Firestore. Please choose different dates.");
            }
        } catch (firestoreError) {
            // Log the error but continue with the booking process
            console.warn("Could not check Firestore for overlapping bookings:", firestoreError);
            // We'll rely on Realtime DB check instead
        }
        
        // ჯერ შევამოწმოთ საჭიროა თუ არა დამატებითი საწოლები
        // და თუ საჭიროა, მაგრამ მომხმარებელს არ დაუდასტურებია, შევწყვიტოთ ჯავშნა
        const preCheckResult = await checkRoomAvailability(
            bookingData.roomId,
            bookingData.checkIn,
            bookingData.checkOut,
            bookingData.numberOfRooms,
            totalBedsWithExtra, // გადავცემთ მთლიან საწოლების რაოდენობას დამატებითების ჩათვლით
            false // ჯერ არ ვითვალისწინებთ დადასტურებას, მხოლოდ ვამოწმებთ საჭიროა თუ არა
        );
        
        // თუ საჭიროა დამატებითი საწოლები, მაგრამ მომხმარებელს არ დაუდასტურებია
        if (preCheckResult.needsExtraBeds && !bookingData.extraBedsConfirmed) {
            throw new Error(`Extra beds confirmation required. Regular beds available: ${preCheckResult.availableRegularBeds}, extra beds available: ${preCheckResult.availableExtraBeds}`);
        }
        
        // ახლა შევამოწმოთ საერთო ხელმისაწვდომობა, უკვე დადასტურების გათვალისწინებით
        const availabilityResult = await checkRoomAvailability(
            bookingData.roomId,
            bookingData.checkIn,
            bookingData.checkOut,
            bookingData.numberOfRooms,
            totalBedsWithExtra, // გადავცემთ მთლიან საწოლების რაოდენობას
            bookingData.extraBedsConfirmed // გადავცემთ მომხმარებლის მიერ დადასტურებულ მნიშვნელობას
        );

        if (!availabilityResult.available) {
            throw new Error(`Room is not available. Only ${availabilityResult.availableCount} beds available.`);
        }
        
        // შევქმნათ დაჯავშნის ობიექტი
        const booking = {
            ...bookingData,
            // დავარქვათ კონსისტენტური სახელები
            checkInDate: bookingData.checkIn,
            checkOutDate: bookingData.checkOut,
            // ავტომატურად დავამატოთ დამატებითი ველები
            status: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // დავამატოთ საწოლების რაოდენობა პირდაპირ fields-ში, რომ მარტივად წავიკითხოთ Firebase-იდან
            beds: bookingData.numberOfRooms
        };

        await set(newBookingRef, booking);
        console.log("Booking created successfully");
        
        // ასევე შევინახოთ Firestore-შიც, რომ ორივე ბაზაში იყოს სინქრონიზებული მონაცემები
        try {
            await addDoc(collection(db, "bookings"), {
                roomId: booking.roomId,
                roomName: booking.roomName,
                checkIn: new Date(booking.checkInDate),
                checkOut: new Date(booking.checkOutDate),
                guestName: booking.guestName,
                guestEmail: booking.guestEmail,
                guestPhone: booking.guestPhone,
                guests: booking.beds,
                totalPrice: booking.totalPrice,
                status: booking.status,
                createdAt: new Date(),
                realtimeId: newBookingRef.key || "",
                country: booking.country,
                comment: booking.comment
            });
        } catch (firestoreError) {
            // If Firestore save fails, log it but don't fail the booking
            console.error("Could not save booking to Firestore:", firestoreError);
            // The booking is still saved in Realtime DB
        }
        
        return newBookingRef.key || "";
    } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
    }
}

export const checkRoomAvailability = async (
    roomId: string,
    checkIn: string, // "YYYY-MM-DD"
    checkOut: string, // "YYYY-MM-DD"
    requestedRooms: number,
    totalRoomsInCottage: number,
    extraBedsConfirmed?: boolean
): Promise<{ 
    available: boolean; 
    availableCount: number;
    availableRegularBeds: number; 
    availableExtraBeds: number;
    needsExtraBeds: boolean;
}> => {
    try {
        // მივიღოთ ოთახის დეტალები, რომ ვიცოდეთ რამდენი ჩვეულებრივი და რამდენი დამატებითი საწოლი გვაქვს
        const roomDoc = await getDoc(doc(db, "rooms", roomId));
        if (!roomDoc.exists()) {
            throw new Error("Room not found");
        }
        
        const roomData = roomDoc.data();
        const bedsPerRoom = roomData.beds || 2;
        const totalRooms = roomData.totalRooms || 1;
        const regularBeds = bedsPerRoom * totalRooms;
        const extraBeds = roomData.extraBeds || 0;
        const totalBeds = regularBeds + extraBeds;

        const allBookings = await getAllBookingsFromRealtime();
        const activeBookingsForRoom = allBookings.filter(
            b => b.roomId === roomId && b.status !== 'cancelled' && b.status !== 'completed'
        );

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        // თითოეული დღისთვის ვითვლით დაჯავშნილი საწოლების რაოდენობას
        let maxBookedRooms = 0;
        
        // Check each day in the requested period
        for (let d = new Date(checkInDate); d < checkOutDate; d.setDate(d.getDate() + 1)) {
            let dailyBookedCount = 0;
            for (const booking of activeBookingsForRoom) {
                const bookingCheckIn = new Date(booking.checkInDate);
                const bookingCheckOut = new Date(booking.checkOutDate);
                
                // თუ მიმდინარე დღე არის ჯავშნის პერიოდში
                if (d >= bookingCheckIn && d < bookingCheckOut) {
                    dailyBookedCount += booking.beds;
                }
            }
            
            // If adding the requested rooms would exceed capacity on any day, 
            // the booking should be rejected
            if (dailyBookedCount + requestedRooms > totalRoomsInCottage) {
                console.log(`Room ${roomId} not available on ${d.toISOString().split('T')[0]}: booked=${dailyBookedCount}, requested=${requestedRooms}, total=${totalRoomsInCottage}`);
                
                // გამოვითვალოთ ხელმისაწვდომი საწოლების რაოდენობა
                const availableCount = totalRoomsInCottage - dailyBookedCount;
                // ვთვლით, რომ პირველ რიგში ჩვეულებრივი საწოლები ივსება
                const availableRegularBeds = Math.max(0, regularBeds - dailyBookedCount);
                const availableExtraBeds = Math.max(0, availableCount - availableRegularBeds);
                
                return {
                    available: false,
                    availableCount: availableCount,
                    availableRegularBeds: availableRegularBeds,
                    availableExtraBeds: availableExtraBeds,
                    needsExtraBeds: false // აქ false არის რადგან მაინც არის საკმარისი საწოლები
                };
            }
            
            if (dailyBookedCount > maxBookedRooms) {
                maxBookedRooms = dailyBookedCount;
            }
        }
        
        // გამოვითვალოთ ხელმისაწვდომი საწოლების რაოდენობა
        const availableCount = totalRoomsInCottage - maxBookedRooms;
        
        // ვთვლით, რომ ჯერ ჩვეულებრივი საწოლები ივსება, შემდეგ დამატებითი
        // ამიტომ იმ შემთხვევაში, თუ დაკავებულია maxBookedRooms რაოდენობა,
        // ჩვეულებრივი საწოლებიდან ხელმისაწვდომია:
        const availableRegularBeds = Math.max(0, regularBeds - maxBookedRooms);
        const availableExtraBeds = extraBeds;
        
        // შევამოწმოთ, საჭიროა თუ არა დამატებითი საწოლების გამოყენება
        const needsExtraBeds = requestedRooms > availableRegularBeds && 
                               availableRegularBeds + availableExtraBeds >= requestedRooms;
        
        console.log(`Room availability check for ${roomId}: 
            requested=${requestedRooms}, 
            available=${availableCount}, 
            regularBeds=${regularBeds},
            availableRegularBeds=${availableRegularBeds}, 
            extraBeds=${extraBeds},
            availableExtraBeds=${availableExtraBeds},
            needsExtraBeds=${needsExtraBeds},
            extraBedsConfirmed=${extraBedsConfirmed}`);

        // თუ საჭიროა დამატებითი საწოლები და მომხმარებლმა დაადასტურა მათი გამოყენება,
        // მაშინ ჯავშნა შესაძლებელია, თუ საკმარისი საწოლები არის ხელმისაწვდომი
        let available = false;
        
        // თუ საკმარისი რაოდენობის ჩვეულებრივი საწოლებია
        if (availableRegularBeds >= requestedRooms) {
            available = true;
        } 
        // თუ საჭიროა დამატებითი საწოლები, მაგრამ საკმარისი საწოლები არის ჯამში და მომხმარებელმა დაადასტურა
        else if (needsExtraBeds && extraBedsConfirmed && availableCount >= requestedRooms) {
            available = true;
        }
        
        return {
            available: available,
            availableCount: availableCount,
            availableRegularBeds: availableRegularBeds,
            availableExtraBeds: availableExtraBeds,
            needsExtraBeds: needsExtraBeds
        };
    } catch (error) {
        console.error("Error checking room availability:", error);
        return { 
            available: false, 
            availableCount: 0,
            availableRegularBeds: 0,
            availableExtraBeds: 0, 
            needsExtraBeds: false
        };
    }
};

// ფუნქცია რომელიც აბრუნებს ყველა ხელმისაწვდომ ოთახებს მითითებულ თარიღებში
export const getAvailableRooms = async (
    checkIn: string, // "YYYY-MM-DD"
    checkOut: string, // "YYYY-MM-DD"
    requestedRooms: number = 1,
    extraBedsConfirmed?: boolean
): Promise<{
    room: Room;
    availableCount: number;
    availableRegularBeds: number;
    availableExtraBeds: number;
    needsExtraBeds: boolean;
}[]> => {
    try {
        // მივიღოთ ყველა ოთახი
        const roomsSnapshot = await getDocs(query(collection(db, "rooms"), orderBy("position")));
        const allRooms: Room[] = [];
        
        roomsSnapshot.forEach((doc) => {
            const data = doc.data();
            allRooms.push({
                id: doc.id,
                name: data.name,
                description: data.description,
                price: data.price,
                beds: data.beds || 2,
                totalRooms: data.totalRooms || 1,
                extraBeds: data.extraBeds || 0,
                minBookingBeds: data.minBookingBeds || 1,
                imageUrl: data.imageUrl,
                images: data.images || [],
                position: data.position || 0,
                createdAt: data.createdAt.toDate()
            });
        });
        
        // მივიღოთ ყველა აქტიური ჯავშანი
        const allBookings = await getAllBookingsFromRealtime();
        const activeBookings = allBookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed');
        
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        
        // შევამოწმოთ თითოეული ოთახის ხელმისაწვდომობა
        const availableRoomsWithCounts = await Promise.all(allRooms.map(async (room) => {
            // გამოვითვალოთ ოთახის მთლიანი საწოლების რაოდენობა
            const regularBeds = (room.beds || 2) * (room.totalRooms || 1);
            const extraBeds = room.extraBeds || 0;
            const totalBedsInRoom = regularBeds + extraBeds;
            let maxBookedRooms = 0;
            let minAvailableBeds = totalBedsInRoom;
            
            // Check each day in the requested period
            for (let d = new Date(checkInDate); d < checkOutDate; d.setDate(d.getDate() + 1)) {
                let dailyBookedCount = 0;
                for (const booking of activeBookings.filter(b => b.roomId === room.id)) {
                    const bookingCheckIn = new Date(booking.checkInDate);
                    const bookingCheckOut = new Date(booking.checkOutDate);
                    
                    if (d >= bookingCheckIn && d < bookingCheckOut) {
                        dailyBookedCount += booking.beds;
                    }
                }
                
                if (dailyBookedCount > maxBookedRooms) {
                    maxBookedRooms = dailyBookedCount;
                }
                
                // Track the minimum available beds across all days
                const dailyAvailableBeds = totalBedsInRoom - dailyBookedCount;
                if (dailyAvailableBeds < minAvailableBeds) {
                    minAvailableBeds = dailyAvailableBeds;
                }
            }
            
            // Use the minimum available beds across the entire period
            const availableCount = minAvailableBeds;
            
            // გამოვითვალოთ ხელმისაწვდომი ჩვეულებრივი და დამატებითი საწოლების რაოდენობა
            const availableRegularBeds = Math.max(0, regularBeds - maxBookedRooms);
            const availableExtraBeds = Math.min(extraBeds, availableCount - availableRegularBeds);
            
            // შევამოწმოთ, საჭიროა თუ არა დამატებითი საწოლების გამოყენება
            const needsExtraBeds = requestedRooms > availableRegularBeds && 
                                  availableRegularBeds + availableExtraBeds >= requestedRooms;
            
            console.log(`Room ${room.id} (${room.name}) availability: 
                totalBeds=${totalBedsInRoom}, 
                maxBooked=${maxBookedRooms}, 
                available=${availableCount},
                regularBeds=${regularBeds},
                availableRegularBeds=${availableRegularBeds},
                extraBeds=${extraBeds},
                availableExtraBeds=${availableExtraBeds},
                needsExtraBeds=${needsExtraBeds}`);
            
            return {
                room,
                availableCount,
                availableRegularBeds,
                availableExtraBeds,
                needsExtraBeds
            };
        }));
        
        // დავაბრუნოთ მხოლოდ ის ოთახები, რომლებიც ხელმისაწვდომია მოთხოვნილი რაოდენობისთვის
        // და ასევე გავითვალისწინოთ minBookingBeds პარამეტრი
        return availableRoomsWithCounts.filter(item => {
            // შევამოწმოთ ხელმისაწვდომია თუ არა საკმარისი რაოდენობის საწოლები
            const isEnoughBedsAvailable = item.availableCount >= requestedRooms;
            
            // შევამოწმოთ აკმაყოფილებს თუ არა მოთხოვნილი საწოლების რაოდენობა მინიმალურ მოთხოვნას
            const meetsMinBookingRequirement = requestedRooms >= (item.room.minBookingBeds || 1);
            
            // დავაბრუნოთ მხოლოდ ის ოთახები, რომლებიც ორივე პირობას აკმაყოფილებენ
            return isEnoughBedsAvailable && meetsMinBookingRequirement;
        });
    } catch (error) {
        console.error("Error getting available rooms:", error);
        return [];
    }
}; 