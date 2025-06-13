"use client"

import { useState, useEffect } from "react"
import { UploadForm } from "@/components/upload-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { saveImageMetadata, deleteImageWithMetadata } from "@/lib/upload-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Trash2 } from "lucide-react"
import { doc, getDoc, setDoc, arrayUnion, updateDoc, deleteDoc, getDocs, collection, DocumentData } from "firebase/firestore"
import { db, storage } from "@/lib/firebase"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { getDownloadURL, ref } from "firebase/storage"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"

export default function AdminDiningPage() {
  const [diningSuccess, setDiningSuccess] = useState(false)
  const [heroSuccess, setHeroSuccess] = useState(false)
  const [menuSuccess, setMenuSuccess] = useState(false)
  const [currentHeroImage, setCurrentHeroImage] = useState("")
  const [currentMenuImages, setCurrentMenuImages] = useState<string[]>([])
  const [diningImages, setDiningImages] = useState<{id: string, url: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<{id: string, url: string, type: 'dining' | 'hero' | 'menu', index?: number} | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ფუნქცია Firebase Storage URL-ის გასაწმენდად და დასაკონვერტირებლად
  const getProperImageUrl = async (url: string): Promise<string | null> => {
    if (!url) return null;
    
    if (url.startsWith('gs://')) {
      try {
        // თუ URL იწყება gs:// ფორმატით, გადავაკონვერტიროთ https:// ფორმატში
        const storageRef = ref(storage, url);
        const httpsUrl = await getDownloadURL(storageRef);
        return httpsUrl;
      } catch (error) {
        console.error("Error converting gs:// URL:", error);
        return null; // შეცდომის შემთხვევაში ვაბრუნებთ null
      }
    }
    
    // არ ვამოწმებთ URL-ის ვალიდურობას
    return url;
  };

  useEffect(() => {
    // Fetch current hero and menu images if they exist
    const fetchImages = async () => {
      try {
        setLoading(true);
        
        // ჰერო სურათის წამოღება
        const heroDoc = await getDoc(doc(db, "sections", "diningHero"))
        if (heroDoc.exists() && heroDoc.data().imageUrl) {
          const heroUrl = await getProperImageUrl(heroDoc.data().imageUrl);
          if (heroUrl) {
            setCurrentHeroImage(heroUrl);
          }
        }

        // მენიუს სურათების წამოღება
        const menuDoc = await getDoc(doc(db, "sections", "diningMenu"))
        if (menuDoc.exists() && menuDoc.data().imageUrls && Array.isArray(menuDoc.data().imageUrls)) {
          const urls = menuDoc.data().imageUrls;
          const processedUrls = [];
          
          for (const url of urls) {
            const processedUrl = await getProperImageUrl(url);
            if (processedUrl) {
              processedUrls.push(processedUrl);
            }
          }
          
          setCurrentMenuImages(processedUrls);
        } else if (menuDoc.exists() && menuDoc.data().imageUrl) {
          // წინა ვერსიის თავსებადობა - თუ ერთი სურათი არსებობს, მასივში გადავიყვანოთ
          const processedUrl = await getProperImageUrl(menuDoc.data().imageUrl);
          if (processedUrl) {
            setCurrentMenuImages([processedUrl]);
          }
        }
        
        // რესტორნის სურათების წამოღება
        const diningSnapshot = await getDocs(collection(db, "dining"))
        const images: {id: string, url: string}[] = [];
        
        for (const doc of diningSnapshot.docs) {
          if (doc.data().url) {
            const processedUrl = await getProperImageUrl(doc.data().url);
            if (processedUrl) {
            images.push({
              id: doc.id,
                url: processedUrl
            });
            }
          }
        }
        
        setDiningImages(images);
        
      } catch (error) {
        console.error("Error fetching images:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchImages()
  }, [diningSuccess, heroSuccess, menuSuccess])

  const handleDiningUpload = async (url: string) => {
    try {
      await saveImageMetadata("dining", url, {
        section: "dining",
        caption: "",
      })
      setDiningSuccess(true)

      // Reset success message after 3 seconds
      setTimeout(() => {
        setDiningSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Error saving dining image:", error)
    }
  }

  const handleHeroUpload = async (url: string) => {
    try {
      // Save to diningHero section in Firestore
      await setDoc(doc(db, "sections", "diningHero"), {
        imageUrl: url,
        updatedAt: new Date().toISOString(),
      })
      
      setCurrentHeroImage(url)
      setHeroSuccess(true)

      // Reset success message after 3 seconds
      setTimeout(() => {
        setHeroSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Error saving hero image:", error)
    }
  }

  const handleMenuUpload = async (url: string) => {
    try {
      // შევამოწმოთ არსებული სურათების რაოდენობა
      if (currentMenuImages.length >= 6) {
        console.error("Maximum number of menu images (6) reached")
        return
      }

      const menuRef = doc(db, "sections", "diningMenu")
      const menuDoc = await getDoc(menuRef)
      
      if (!menuDoc.exists()) {
        // თუ დოკუმენტი არ არსებობს, შევქმნათ ახალი მასივით
        await setDoc(menuRef, {
          imageUrls: [url],
          updatedAt: new Date().toISOString(),
        })
      } else {
        // დავამატოთ ახალი URL არსებულ მასივს
        await updateDoc(menuRef, {
          imageUrls: arrayUnion(url),
          updatedAt: new Date().toISOString(),
        })
      }
      
      // განვაახლოთ ლოკალური მდგომარეობა
      setCurrentMenuImages([...currentMenuImages, url])
      setMenuSuccess(true)

      // Reset success message after 3 seconds
      setTimeout(() => {
        setMenuSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Error saving menu image:", error)
    }
  }

  const handleRemoveMenuImage = async (imageToRemove: string, index: number) => {
    setImageToDelete({ id: 'menu-' + index, url: imageToRemove, type: 'menu', index });
    setDeleteDialogOpen(true);
  }
  
  const handleDeleteImage = (id: string, url: string, type: 'dining' | 'hero') => {
    setImageToDelete({ id, url, type });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;

    setDeleteLoading(true);
    try {
      if (imageToDelete.type === 'dining') {
        // წავშალოთ სურათი dining კოლექციიდან
        await deleteImageWithMetadata('dining', imageToDelete.id, imageToDelete.url);
        setDiningImages(diningImages.filter(img => img.id !== imageToDelete.id));
        toast({
          title: "სურათი წაიშალა",
          description: "რესტორნის სურათი წარმატებით წაიშალა",
        });
        setDiningSuccess(prev => !prev); // ხელახლა ჩავტვირთოთ სურათები
      } else if (imageToDelete.type === 'hero') {
        // ჰერო სურათის შემთხვევაში, მხოლოდ ვშლით მიმთითებელს Firestore-დან
        await setDoc(doc(db, "sections", "diningHero"), {
          imageUrl: "",
          updatedAt: new Date().toISOString(),
        });
        setCurrentHeroImage("");
        toast({
          title: "ჰერო სურათი წაიშალა",
          description: "რესტორნის ჰერო სურათი წარმატებით წაიშალა",
        });
      } else if (imageToDelete.type === 'menu' && typeof imageToDelete.index === 'number') {
        // მენიუს სურათის წაშლა
        const updatedImages = [...currentMenuImages];
        updatedImages.splice(imageToDelete.index, 1);
        
        await setDoc(doc(db, "sections", "diningMenu"), {
          imageUrls: updatedImages,
          updatedAt: new Date().toISOString(),
        });
        
        setCurrentMenuImages(updatedImages);
        toast({
          title: "მენიუს სურათი წაიშალა",
          description: "მენიუს სურათი წარმატებით წაიშალა",
        });
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "შეცდომა",
        description: "სურათის წაშლა ვერ მოხერხდა",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Manage Fine Dining</h1>

      {/* Hero Image Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Fine Dining Hero Image</CardTitle>
        </CardHeader>
        <CardContent>
          {heroSuccess && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Fine Dining hero image updated successfully!
              </AlertDescription>
            </Alert>
          )}
          
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Current Hero Image:</h3>
            {loading ? (
              <div className="relative h-48 w-full rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-400"></div>
              </div>
            ) : currentHeroImage ? (
              <div className="relative h-48 w-full rounded-md overflow-hidden group">
                <Image 
                  src={currentHeroImage}
                  alt="Current hero image"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteImage("diningHero", currentHeroImage, 'hero')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    წაშლა
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative h-48 w-full rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400">No hero image uploaded</p>
            </div>
          )}
          </div>

          <UploadForm
            title="Upload Hero Image"
            description="This image will appear as the header of the Fine Dining page."
            path="dining-hero"
            onUploadComplete={handleHeroUpload}
            acceptMultiple={false}
          />
        </CardContent>
      </Card>

      {/* Menu Images Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Menu Images</CardTitle>
        </CardHeader>
        <CardContent>
          {menuSuccess && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Menu image added successfully!
              </AlertDescription>
            </Alert>
          )}
          
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Current Menu Images: ({currentMenuImages.length}/6)</h3>
            {loading ? (
              <div className="relative h-64 w-full rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-400"></div>
              </div>
            ) : currentMenuImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {currentMenuImages.map((image, index) => (
                  <div key={index} className="relative rounded-md overflow-hidden bg-gray-50 group">
                    <div className="relative h-64 w-full">
                      <Image 
                        src={image}
                        alt={`Menu image ${index + 1}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button 
                        className="p-1 rounded-full bg-red-500 hover:bg-red-600 text-white"
                        size="icon"
                        variant="destructive"
                        onClick={() => handleRemoveMenuImage(image, index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative h-48 w-full rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400">No menu images uploaded</p>
            </div>
          )}
          </div>

          {currentMenuImages.length < 6 ? (
            <UploadForm
              title="Upload Menu Image"
              description={`Add a menu image (${currentMenuImages.length}/6). You can add up to 6 images.`}
              path="dining-menu"
              onUploadComplete={handleMenuUpload}
              acceptMultiple={false}
            />
          ) : (
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-600">
                Maximum number of menu images (6) reached. Please remove some images to add more.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dining Images Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Dining Images</CardTitle>
        </CardHeader>
        <CardContent>
          {diningSuccess && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Image uploaded to dining gallery successfully!
              </AlertDescription>
            </Alert>
          )}

          <UploadForm
            title="Upload Dining Images"
            description="These images will appear in the dining gallery section."
            path="dining"
            onUploadComplete={handleDiningUpload}
            acceptMultiple={true}
          />
          
          {/* დავამატოთ რესტორნის სურათების გალერეა */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Dining Images Gallery</h3>
            {loading ? (
              <div className="relative h-48 w-full rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-400"></div>
              </div>
            ) : diningImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {diningImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-[4/3] rounded-md overflow-hidden">
                      <img
                        src={image.url}
                        alt="Dining image"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const container = (e.target as HTMLImageElement).closest('.relative');
                          if (container) {
                            (container as HTMLElement).style.display = "none";
                          }
                        }}
                      />
                      
                      {/* ინფორმაცია ფოტოზე */}
                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDeleteImage(image.id, image.url, 'dining')}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          წაშლა
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative h-48 w-full rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400">No dining images uploaded</p>
            </div>
          )}
          </div>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>სურათის წაშლა</DialogTitle>
            <DialogDescription>
              დარწმუნებული ხართ, რომ გსურთ სურათის წაშლა? ეს მოქმედება შეუქცევადია.
            </DialogDescription>
          </DialogHeader>
          
          {imageToDelete && (
            <div className="relative h-48 w-full rounded-md overflow-hidden my-4">
              <Image 
                src={imageToDelete.url}
                alt="Image to delete"
                fill
                className="object-contain"
              />
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={deleteLoading}>გაუქმება</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteImage} 
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2" />
                  მიმდინარეობს წაშლა...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  წაშლა
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
