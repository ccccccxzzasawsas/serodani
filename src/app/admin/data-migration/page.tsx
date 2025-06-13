"use client"

import { useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import { 
  saveSectionToRealtime,
  getSectionFromRealtime
} from "@/lib/realtimeDb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import { ref, listAll, getDownloadURL, getMetadata } from "firebase/storage"

export default function DataMigrationPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{section: string, status: 'success' | 'error', message: string}[]>([])
  const [completed, setCompleted] = useState(false)

  const migrateImageLinks = async () => {
    try {
      setLoading(true)
      setResults([])
      setCompleted(false)
      
      // სექციები, რომლებიც შეიცავენ სურათებს
      const sectionsToMigrate = [
        { name: "hero", imageField: "imageUrl" },
        { name: "slider", imageField: "imageUrls" },
        { name: "story", imageField: "imageUrls" },
        { name: "largePhoto", imageField: "imageUrl" },
        { name: "guestReview", imageField: "imageUrl" },
        { name: "roomsHero", imageField: "imageUrl" },
        { name: "seeDo", imageField: "imageUrl" }
      ]
      
      // 1. ჯერ მიგრირება გავუკეთოთ Firestore-დან
      for (const section of sectionsToMigrate) {
        try {
          // Firestore-დან წაკითხვა
          const docRef = doc(db, "sections", section.name)
          const docSnap = await getDoc(docRef)
          
          if (docSnap.exists() && docSnap.data()[section.imageField]) {
            // მხოლოდ სურათების ლინკების შემცველი ობიექტის შექმნა
            const imageData = {
              [section.imageField]: docSnap.data()[section.imageField]
            }
            
            // Realtime Database-ში ჩაწერა
            await saveSectionToRealtime(section.name, imageData)
            
            setResults(prev => [...prev, {
              section: section.name,
              status: 'success',
              message: `წარმატებით გადაკოპირდა: ${JSON.stringify(imageData).slice(0, 50)}...`
            }])
          } else {
            setResults(prev => [...prev, {
              section: section.name,
              status: 'error',
              message: 'მონაცემები ვერ მოიძებნა Firestore-ში'
            }])
          }
        } catch (error: any) {
          setResults(prev => [...prev, {
            section: section.name,
            status: 'error',
            message: `შეცდომა: ${error.message}`
          }])
        }
      }
      
      // 2. ახლა გალერიის სურათების მიგრაცია გავუკეთოთ Storage-დან
      try {
        setResults(prev => [...prev, {
          section: 'gallery',
          status: 'success',
          message: 'გალერიის მიგრაცია დაიწყო...'
        }])
        
        // Storage-დან გალერიის სურათების წამოღება
        const galleryRef = ref(storage, '/gallery');
        const galleryResult = await listAll(galleryRef);
        
        if (galleryResult.items.length > 0) {
          // შევაგროვოთ ყველა ფაილის მეტადატა და URL ერთდროულად
          const galleryImagesWithMetadata = await Promise.all(
            galleryResult.items.map(async (imageRef) => {
              try {
                const url = await getDownloadURL(imageRef);
                const metadata = await getMetadata(imageRef);
                return {
                  url: url,
                  timeCreated: metadata.timeCreated ? new Date(metadata.timeCreated).toISOString() : new Date().toISOString(),
                  name: imageRef.name
                };
              } catch (error) {
                console.error(`Error processing gallery image ${imageRef.name}:`, error);
                return null;
              }
            })
          );
          
          // გავფილტროთ null მნიშვნელობები და დავალაგოთ თარიღის მიხედვით
          const validGalleryImages = galleryImagesWithMetadata.filter(item => item !== null);
          
          if (validGalleryImages.length > 0) {
            // შევინახოთ გალერიის სურათები Realtime Database-ში
            await saveSectionToRealtime("gallery", { 
              images: validGalleryImages,
              updatedAt: new Date().toISOString() 
            });
            
            setResults(prev => [...prev, {
              section: 'gallery',
              status: 'success',
              message: `გალერიის ${validGalleryImages.length} სურათი წარმატებით გადავიტანეთ`
            }])
          } else {
            setResults(prev => [...prev, {
              section: 'gallery',
              status: 'error',
              message: 'ვერ მოიძებნა ვალიდური გალერიის სურათები'
            }])
          }
        } else {
          setResults(prev => [...prev, {
            section: 'gallery',
            status: 'error',
            message: 'გალერიის ფოლდერში სურათები არ არის'
          }])
        }
      } catch (error: any) {
        setResults(prev => [...prev, {
          section: 'gallery',
          status: 'error',
          message: `გალერიის მიგრაციის შეცდომა: ${error.message}`
        }])
      }
      
      setCompleted(true)
    } catch (error: any) {
      console.error("Migration error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">მონაცემების მიგრაცია</h1>
      <p className="text-gray-600 mb-8">Firestore-დან Realtime Database-ში ფოტოების ლინკების გადატანა</p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>მიგრაციის ინსტრუმენტი</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">
              ეს ხელსაწყო გადაიტანს მხოლოდ ფოტოების ლინკებს Firestore-დან Realtime Database-ში.
              თვითონ ფოტოები დარჩება Storage-ში, მხოლოდ მათზე მიმართვები გადაკოპირდება ახალ ბაზაში.
            </p>
            
            <div className="flex mt-4">
              <Button 
                onClick={migrateImageLinks}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "მიმდინარეობს მიგრაცია..." : "დაიწყე მიგრაცია"}
              </Button>
            </div>
          </div>

          {results.length > 0 && (
            <div className="border rounded-md p-4 mt-4">
              <h3 className="font-medium mb-2">შედეგები:</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <Alert key={index} className={result.status === 'success' ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
                    {result.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    <AlertDescription className={result.status === 'success' ? "text-green-600" : "text-amber-600"}>
                      <span className="font-medium">{result.section}:</span> {result.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
              
              {completed && (
                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-600">
                    მიგრაცია დასრულებულია! გადავიდეთ <a href="/admin/home-page" className="underline">მთავარი გვერდის რედაქტირებაზე</a> და გავტესტოთ.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 