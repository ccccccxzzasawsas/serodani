import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { doc, setDoc, collection, addDoc, updateDoc, getDoc, deleteDoc } from "firebase/firestore"
import { storage, db } from "./firebase"
import { v4 as uuidv4 } from "uuid"
import imageCompression from "browser-image-compression"

// Image compression options
const compressionOptions = {
  maxSizeMB: 1,          // მაქსიმალური ზომა მეგაბაიტებში
  maxWidthOrHeight: 1920, // მაქსიმალური სიგანე ან სიმაღლე
  useWebWorker: true,     // იყენებს Web Worker-ს, თუ შესაძლებელია
  fileType: 'image/webp', // გადაიყვანოს webp ფორმატში
  initialQuality: 0.8    // საწყისი ხარისხი
}

// Check if browser supports webP
const supportsWebP = async (): Promise<boolean> => {
  if (!window || !window.createImageBitmap) return false;
  
  try {
    const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
    const blob = await fetch(webpData).then(r => r.blob());
    await createImageBitmap(blob);
    return true;
  } catch {
    return false;
  }
};

// Image upload with compression
export async function uploadImage(file: File, path: string): Promise<string> {
  try {
    // ვამოწმებთ, არის თუ არა საჭირო კომპრესია
    // 1MB-ზე დიდი ან სურათი
    const needsCompression = file.size > 1024 * 1024;
    
    let fileToUpload = file;
    let fileName = uuidv4();
    let fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    
    // თუ ბრაუზერი მხარს უჭერს webP-ს, გამოვიყენოთ ეს ფორმატი
    const supportsWebPFormat = await supportsWebP();
    
    // ჩავატაროთ კომპრესია, თუ საჭიროა
    if (needsCompression) {
      console.log(`Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      
      // განსაზღვრავთ კომპრესიის პარამეტრებს
      const options = {
        ...compressionOptions,
        fileType: supportsWebPFormat ? 'image/webp' : 'image/jpeg'
      };
      
      // ვახდენთ კომპრესიას
      fileToUpload = await imageCompression(file, options);
      
      // განვსაზღვრავთ ფაილის გაფართოებას
      fileExtension = supportsWebPFormat ? 'webp' : 'jpg';
      
      console.log(`Compressed to: ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // Generate a unique filename
    const finalFileName = `${fileName}.${fileExtension}`;
    const storageRef = ref(storage, `${path}/${finalFileName}`);

    // Upload the compressed file (or original if no compression)
    const snapshot = await uploadBytes(storageRef, fileToUpload);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

// Delete image from storage
export async function deleteImage(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch (error) {
    console.error("Error deleting image:", error)
    throw error
  }
}

// Delete image from storage and its metadata from Firestore
export async function deleteImageWithMetadata(
  collection: string,
  documentId: string,
  imageUrl: string
): Promise<void> {
  try {
    // 1. წაშალე დოკუმენტი Firestore-დან
    const docRef = doc(db, collection, documentId);
    await deleteDoc(docRef);
    
    // 2. წაშალე სურათი Storage-დან
    try {
      // თუ URL არის სრული URL და არა Storage path
      if (imageUrl.startsWith('https://')) {
        // გაასწორე ორმაგი ენკოდირება %252F → %2F
        if (imageUrl.includes('%252F')) {
          imageUrl = imageUrl.replace(/%252F/g, '%2F');
        }
        
        // დავლოგოთ URL დამუშავებამდე
        console.log("Deleting image from URL before parsing:", imageUrl);
        
        try {
          // გარდავქმნათ URL Storage path-ად
          const urlObj = new URL(imageUrl);
          const pathSegments = urlObj.pathname.split('/');
          
          // Firebase Storage URL ფორმატის დამუშავება: /v0/b/{bucket}/o/{encodedFilePath}
          // პირველი პათი არის ცარიელი, მეორე არის v0, მესამე არის b, მეოთხე არის bucket
          const bucket = pathSegments[3]; // ეს არის bucket-ის სახელი
          
          // o-ს შემდეგ მოდის ფაილის გზა
          let path = '';
          if (pathSegments.length > 5 && pathSegments[4] === 'o') {
            // მთლიანი გზა o-ს შემდეგ, ჩვეულებრივ ერთი ელემენტია, მაგრამ შეიძლება მძიმით იყოს გამოყოფილი
            const encodedPath = pathSegments.slice(5).join('/');
            path = decodeURIComponent(encodedPath);
            
            // თუ URL-ს აქვს query პარამეტრები (alt=media, token და ა.შ.), მოვაშოროთ
            const questionMarkIndex = path.indexOf('?');
            if (questionMarkIndex !== -1) {
              path = path.substring(0, questionMarkIndex);
            }
          }
          
          console.log("Extracted storage path:", path);
          
          if (path) {
            const storageRef = ref(storage, path);
            await deleteObject(storageRef);
            console.log("Successfully deleted image from storage with path:", path);
          } else {
            console.error("Could not extract valid path from URL:", imageUrl);
          }
        } catch (urlError) {
          console.error("Error parsing Firebase Storage URL:", urlError);
          console.error("Problematic URL:", imageUrl);
        }
      } else {
        // თუ უკვე Storage path-ია
        console.log("Deleting image using direct storage path:", imageUrl);
        const storageRef = ref(storage, imageUrl);
        await deleteObject(storageRef);
        console.log("Successfully deleted image using direct path");
      }
    } catch (storageError) {
      console.error("Error deleting image from storage:", storageError);
      // გავაგრძელოთ მაინც, რადგან Firestore დოკუმენტი უკვე წაშლილია
    }
  } catch (error) {
    console.error("Error deleting image with metadata:", error);
    throw error;
  }
}

// Save image metadata to Firestore
export async function saveImageMetadata(
  section: string,
  imageUrl: string,
  metadata: { [key: string]: any },
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, section), {
      url: imageUrl,
      ...metadata,
      createdAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error saving image metadata:", error)
    throw error
  }
}

// Update specific section content
export async function updateSectionContent(section: string, content: { [key: string]: any }): Promise<void> {
  try {
    const docRef = doc(db, "sections", section)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      await updateDoc(docRef, content)
    } else {
      await setDoc(docRef, {
        ...content,
        updatedAt: new Date(),
      })
    }
  } catch (error) {
    console.error(`Error updating ${section} content:`, error)
    throw error
  }
}

// Add a new room
export async function addRoom(roomData: {
  name: string
  description?: string
  price: number
  beds?: number
  extraBeds?: number
  minBookingBeds?: number
  bedPrices?: { beds: number; price: number }[]
  imageUrl: string
  images?: { url: string; position: number }[]
  position?: number
}): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "rooms"), {
      ...roomData,
      // თუ სურათების მასივი არ არის მოცემული, მაშინ შევქმნათ ერთელემენტიანი მასივი მთავარი სურათით
      images: roomData.images || [{ url: roomData.imageUrl, position: 0 }],
      position: roomData.position || 0,
      beds: roomData.beds || 2, // ნაგულისხმევად 2 საწოლი
      extraBeds: roomData.extraBeds || 0, // ნაგულისხმევად 0 დამატებითი საწოლი
      minBookingBeds: roomData.minBookingBeds || 1, // ნაგულისხმევად მინიმუმ 1 საწოლი
      createdAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding room:", error)
    throw error
  }
}

// Update hero section
export async function updateHeroSection(imageUrl: string): Promise<void> {
  await updateSectionContent("hero", { imageUrl })
}

// Update slider images
export async function updateSliderImages(imageUrls: string[]): Promise<void> {
  await updateSectionContent("slider", { imageUrls })
}

// Update story section images
export async function updateStoryImages(imageUrl: string): Promise<void> {
  await updateSectionContent("story", { imageUrl })
}

// Update large photo below story
export async function updateLargePhoto(imageUrl: string): Promise<void> {
  await updateSectionContent("largePhoto", { imageUrl })
}

// Update guest review image
export async function updateGuestReviewImage(imageUrl: string): Promise<void> {
  await updateSectionContent("guestReview", { imageUrl })
}

// Update rooms page hero image
export async function updateRoomsHeroImage(imageUrl: string): Promise<void> {
  await updateSectionContent("roomsHero", { imageUrl })
}

// Update room position in Firestore
export async function updateRoomPosition(roomId: string, position: number): Promise<void> {
  try {
    const docRef = doc(db, "rooms", roomId);
    await updateDoc(docRef, { position });
  } catch (error) {
    console.error("Error updating room position:", error);
    throw error;
  }
}

// Update positions for all rooms in a batch, assigns sequential position numbers
export async function reorderAllRoomPositions(roomIds: string[]): Promise<void> {
  try {
    // Update each room with its new position based on the array index
    for (let i = 0; i < roomIds.length; i++) {
      const docRef = doc(db, "rooms", roomIds[i]);
      await updateDoc(docRef, { position: i });
    }
  } catch (error) {
    console.error("Error reordering room positions:", error);
    throw error;
  }
}

// Update room price in Firestore
export async function updateRoomPrice(roomId: string, newPrice: number): Promise<void> {
  try {
    const docRef = doc(db, "rooms", roomId);
    await updateDoc(docRef, { price: newPrice });
  } catch (error) {
    console.error("Error updating room price:", error);
    throw error;
  }
}

// განაახლებს ოთახის ფასებს საწოლების რაოდენობის მიხედვით
export async function updateRoomBedPrices(
  roomId: string, 
  bedPrices: { beds: number; price: number }[]
): Promise<void> {
  try {
    const docRef = doc(db, "rooms", roomId);
    await updateDoc(docRef, { bedPrices });
  } catch (error) {
    console.error("Error updating room bed prices:", error);
    throw error;
  }
}

// წაშალე hero სექციის სურათი
export async function deleteHeroImage(): Promise<void> {
  try {
    const docRef = doc(db, "sections", "hero");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().imageUrl) {
      const imageUrl = docSnap.data().imageUrl;
      
      // წავშალოთ ფაილი Firebase Storage-დან, თუ შესაძლებელია
      try {
        await deleteImageFromStorage(imageUrl);
      } catch (error) {
        console.error("Error deleting hero image file:", error);
        // გავაგრძელოთ მაინც, რადგან დოკუმენტიდან ინფორმაცია უნდა წავშალოთ
      }
      
      // წავშალოთ სურათის URL დოკუმენტიდან
      await updateDoc(docRef, { imageUrl: null });
    }
  } catch (error) {
    console.error("Error deleting hero image:", error);
    throw error;
  }
}

// წაშალე slider სურათი
export async function deleteSliderImage(index: number): Promise<void> {
  try {
    const docRef = doc(db, "sections", "slider");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().imageUrls && Array.isArray(docSnap.data().imageUrls)) {
      const imageUrls = docSnap.data().imageUrls;
      
      // თუ ინდექსი არ არის მასივის ფარგლებში, შეცდომას ვაბრუნებთ
      if (index < 0 || index >= imageUrls.length) {
        throw new Error(`Invalid index: ${index} for slider images array of length ${imageUrls.length}`);
      }
      
      // წავშალოთ ფაილი Firebase Storage-დან, თუ შესაძლებელია
      try {
        await deleteImageFromStorage(imageUrls[index]);
      } catch (error) {
        console.error(`Error deleting slider image file at index ${index}:`, error);
        // გავაგრძელოთ მაინც, რადგან მასივიდან ელემენტი უნდა წავშალოთ
      }
      
      // წავშალოთ სურათი მასივიდან
      const updatedImageUrls = [...imageUrls];
      updatedImageUrls.splice(index, 1);
      
      // განვაახლოთ დოკუმენტი
      await updateDoc(docRef, { imageUrls: updatedImageUrls });
    }
  } catch (error) {
    console.error("Error deleting slider image:", error);
    throw error;
  }
}

// წაშალე ყველა slider სურათი
export async function deleteAllSliderImages(): Promise<void> {
  try {
    const docRef = doc(db, "sections", "slider");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().imageUrls && Array.isArray(docSnap.data().imageUrls)) {
      const imageUrls = docSnap.data().imageUrls;
      
      // ვეცადოთ ყველა ფაილის წაშლა Storage-დან
      for (const url of imageUrls) {
        try {
          await deleteImageFromStorage(url);
        } catch (error) {
          console.error("Error deleting slider image file:", error);
          // გავაგრძელოთ მაინც, სხვა ფაილების წასაშლელად
        }
      }
      
      // განვაახლოთ დოკუმენტი ცარიელი მასივით
      await updateDoc(docRef, { imageUrls: [] });
    }
  } catch (error) {
    console.error("Error deleting all slider images:", error);
    throw error;
  }
}

// წაშალე story სექციის სურათი
export async function deleteStoryImage(): Promise<void> {
  try {
    const docRef = doc(db, "sections", "story");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().imageUrl) {
      const imageUrl = docSnap.data().imageUrl;
      
      // წავშალოთ ფაილი Firebase Storage-დან, თუ შესაძლებელია
      try {
        await deleteImageFromStorage(imageUrl);
      } catch (error) {
        console.error("Error deleting story image file:", error);
        // გავაგრძელოთ მაინც, რადგან დოკუმენტიდან ინფორმაცია უნდა წავშალოთ
      }
      
      // წავშალოთ სურათის URL დოკუმენტიდან
      await updateDoc(docRef, { imageUrl: null });
    }
  } catch (error) {
    console.error("Error deleting story image:", error);
    throw error;
  }
}

// წაშალე largePhoto სურათი
export async function deleteLargePhoto(): Promise<void> {
  try {
    const docRef = doc(db, "sections", "largePhoto");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().imageUrl) {
      const imageUrl = docSnap.data().imageUrl;
      
      // წავშალოთ ფაილი Firebase Storage-დან, თუ შესაძლებელია
      try {
        await deleteImageFromStorage(imageUrl);
      } catch (error) {
        console.error("Error deleting large photo file:", error);
        // გავაგრძელოთ მაინც, რადგან დოკუმენტიდან ინფორმაცია უნდა წავშალოთ
      }
      
      // წავშალოთ სურათის URL დოკუმენტიდან
      await updateDoc(docRef, { imageUrl: null });
    }
  } catch (error) {
    console.error("Error deleting large photo:", error);
    throw error;
  }
}

// წაშალე guestReview სურათი
export async function deleteGuestReviewImage(): Promise<void> {
  try {
    const docRef = doc(db, "sections", "guestReview");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().imageUrl) {
      const imageUrl = docSnap.data().imageUrl;
      
      // წავშალოთ ფაილი Firebase Storage-დან, თუ შესაძლებელია
      try {
        await deleteImageFromStorage(imageUrl);
      } catch (error) {
        console.error("Error deleting guest review image file:", error);
        // გავაგრძელოთ მაინც, რადგან დოკუმენტიდან ინფორმაცია უნდა წავშალოთ
      }
      
      // წავშალოთ სურათის URL დოკუმენტიდან
      await updateDoc(docRef, { imageUrl: null });
    }
  } catch (error) {
    console.error("Error deleting guest review image:", error);
    throw error;
  }
}

// დამხმარე ფუნქცია Firebase Storage-დან ფაილის წასაშლელად
async function deleteImageFromStorage(imageUrl: string): Promise<void> {
  if (!imageUrl) return;
  
  try {
    // თუ URL არის სრული URL და არა Storage path
    if (imageUrl.startsWith('https://')) {
      // გაასწორე ორმაგი ენკოდირება %252F → %2F
      if (imageUrl.includes('%252F')) {
        imageUrl = imageUrl.replace(/%252F/g, '%2F');
      }
      
      // გარდავქმნათ URL Storage path-ად
      const urlObj = new URL(imageUrl);
      const pathSegments = urlObj.pathname.split('/');
      
      // Firebase Storage URL ფორმატის დამუშავება: /v0/b/{bucket}/o/{encodedFilePath}
      let path = '';
      if (pathSegments.length > 5 && pathSegments[4] === 'o') {
        const encodedPath = pathSegments.slice(5).join('/');
        path = decodeURIComponent(encodedPath);
        
        // თუ URL-ს აქვს query პარამეტრები (alt=media, token და ა.შ.), მოვაშოროთ
        const questionMarkIndex = path.indexOf('?');
        if (questionMarkIndex !== -1) {
          path = path.substring(0, questionMarkIndex);
        }
        
        if (path) {
          const storageRef = ref(storage, path);
          await deleteObject(storageRef);
        }
      }
    } else {
      // თუ უკვე Storage path-ია
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.error("Error deleting image from storage:", error);
    throw error;
  }
}
