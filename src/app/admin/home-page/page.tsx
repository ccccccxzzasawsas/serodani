"use client"

import { useState, useEffect } from "react"
import { UploadForm } from "@/components/upload-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  updateHeroSection,
  updateSliderImages,
  updateStoryImages,
  updateLargePhoto,
  updateSectionContent,
  updateGuestReviewImage,
  deleteHeroImage,
  deleteSliderImage,
  deleteStoryImage,
  deleteLargePhoto,
  deleteGuestReviewImage
} from "@/lib/upload-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchHomeSectionImages } from "@/lib/data-fetching"

export default function AdminHomePage() {
  const [activeTab, setActiveTab] = useState("hero")
  const [heroSuccess, setHeroSuccess] = useState(false)
  const [sliderSuccess, setSliderSuccess] = useState(false)
  const [storySuccess, setStorySuccess] = useState(false)
  const [largePhotoSuccess, setLargePhotoSuccess] = useState(false)
  const [guestReviewSuccess, setGuestReviewSuccess] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  // სექციების მონაცემები
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [sliderUrls, setSliderUrls] = useState<string[]>([])
  const [storyImage, setStoryImage] = useState<string | null>(null)
  const [largePhoto, setLargePhoto] = useState<string | null>(null)
  const [guestReviewImage, setGuestReviewImage] = useState<string | null>(null)

  // Reset success messages when changing tabs
  useEffect(() => {
    setHeroSuccess(false)
    setSliderSuccess(false)
    setStorySuccess(false)
    setLargePhotoSuccess(false)
    setGuestReviewSuccess(false)
  }, [activeTab])
  
  // Load current images
  useEffect(() => {
    async function loadImages() {
      try {
        setLoading(true)
        const sectionsData = await fetchHomeSectionImages()
        
        // Set hero image
        if (sectionsData.hero && sectionsData.hero.imageUrl) {
          setHeroImage(sectionsData.hero.imageUrl)
        }
        
        // Set slider images
        if (sectionsData.slider && sectionsData.slider.imageUrls) {
          setSliderUrls(sectionsData.slider.imageUrls || [])
        }
        
        // Set story image - now just one image
        if (sectionsData.story && sectionsData.story.imageUrl) {
          setStoryImage(sectionsData.story.imageUrl)
        }
        
        // Set large photo
        if (sectionsData.largePhoto && sectionsData.largePhoto.imageUrl) {
          setLargePhoto(sectionsData.largePhoto.imageUrl)
        }
        
        // Set guest review image
        if (sectionsData.guestReview && sectionsData.guestReview.imageUrl) {
          setGuestReviewImage(sectionsData.guestReview.imageUrl)
        }
      } catch (error) {
        console.error("Error loading home section images:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadImages()
  }, [])

  const handleHeroUpload = async (url: string) => {
    try {
      await updateHeroSection(url)
      setHeroImage(url)
      setHeroSuccess(true)
    } catch (error) {
      console.error("Error updating hero section:", error)
    }
  }
  
  const handleDeleteHero = async () => {
    try {
      setDeleting("hero")
      await deleteHeroImage()
      setHeroImage(null)
      setHeroSuccess(true)
    } catch (error) {
      console.error("Error deleting hero image:", error)
    } finally {
      setDeleting(null)
    }
  }

  const handleSliderUpload = async (url: string) => {
    try {
      const newUrls = [...sliderUrls, url]
      setSliderUrls(newUrls)
      await updateSliderImages(newUrls)
      setSliderSuccess(true)
    } catch (error) {
      console.error("Error updating slider images:", error)
    }
  }
  
  const handleDeleteSlider = async (index: number) => {
    try {
      setDeleting(`slider-${index}`)
      await deleteSliderImage(index)
      
      // განვაახლოთ სურათების მასივი UI-ში
      const newUrls = [...sliderUrls]
      newUrls.splice(index, 1)
      setSliderUrls(newUrls)
      
      setSliderSuccess(true)
    } catch (error) {
      console.error(`Error deleting slider image at index ${index}:`, error)
    } finally {
      setDeleting(null)
    }
  }

  const handleStoryUpload = async (url: string) => {
    try {
      // ახლა მხოლოდ ერთი სურათი გვჭირდება
      setStoryImage(url)
      await updateSectionContent("story", { imageUrl: url })
      setStorySuccess(true)
    } catch (error) {
      console.error("Error updating story image:", error)
    }
  }
  
  const handleDeleteStory = async () => {
    try {
      setDeleting("story")
      await deleteStoryImage()
      setStoryImage(null)
      setStorySuccess(true)
    } catch (error) {
      console.error("Error deleting story image:", error)
    } finally {
      setDeleting(null)
    }
  }

  const handleLargePhotoUpload = async (url: string) => {
    try {
      await updateLargePhoto(url)
      setLargePhoto(url)
      setLargePhotoSuccess(true)
    } catch (error) {
      console.error("Error updating large photo:", error)
    }
  }
  
  const handleDeleteLargePhoto = async () => {
    try {
      setDeleting("largePhoto")
      await deleteLargePhoto()
      setLargePhoto(null)
      setLargePhotoSuccess(true)
    } catch (error) {
      console.error("Error deleting large photo:", error)
    } finally {
      setDeleting(null)
    }
  }

  const handleGuestReviewUpload = async (url: string) => {
    try {
      await updateGuestReviewImage(url)
      setGuestReviewImage(url)
      setGuestReviewSuccess(true)
    } catch (error) {
      console.error("Error updating guest review image:", error)
    }
  }
  
  const handleDeleteGuestReview = async () => {
    try {
      setDeleting("guestReview")
      await deleteGuestReviewImage()
      setGuestReviewImage(null)
      setGuestReviewSuccess(true)
    } catch (error) {
      console.error("Error deleting guest review image:", error)
    } finally {
      setDeleting(null)
    }
  }

  const handleSeeDoUpload = async (url: string) => {
    try {
      await updateSectionContent("seeDo", { imageUrl: url })
      // Success handling
    } catch (error) {
      console.error("Error updating See & Do section:", error)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">მთავარი გვერდის მართვა</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="hero">Hero Image</TabsTrigger>
          <TabsTrigger value="slider">Slider Images</TabsTrigger>
          <TabsTrigger value="story">Story Section</TabsTrigger>
          <TabsTrigger value="largePhoto">Large Photo</TabsTrigger>
          <TabsTrigger value="guestReview">Guest Review</TabsTrigger>
          <TabsTrigger value="seeDo">See & Do</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <Card className="bg-white shadow-lg border-2">
            <CardHeader>
              <CardTitle>Hero Image</CardTitle>
            </CardHeader>
            <CardContent>
              {heroSuccess && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">Hero image updated successfully!</AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-2">Current Hero Image</h3>
                  <div className="relative h-64 bg-gray-100 rounded-md overflow-hidden border">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : heroImage ? (
                      <>
                        <img src={heroImage} alt="Current Hero" className="w-full h-full object-cover" />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleDeleteHero}
                          disabled={deleting === "hero"}
                        >
                          {deleting === "hero" ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          წაშლა
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400">სურათი არ არის ატვირთული</p>
                      </div>
                    )}
                  </div>
                </div>

                <UploadForm
                  title="Upload New Hero Image"
                  description="This image will appear as the main background at the top of the home page."
                  path="hero"
                  onUploadComplete={handleHeroUpload}
                  previewHeight={250}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slider">
          <Card className="bg-white shadow-lg border-2">
            <CardHeader>
              <CardTitle>Slider Images</CardTitle>
            </CardHeader>
            <CardContent>
              {sliderSuccess && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">Slider images updated successfully!</AlertDescription>
                </Alert>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-medium mb-2">Current Slider Images</h3>
                {loading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : sliderUrls.length > 0 ? (
                  <div className="flex overflow-x-auto space-x-4 pb-4">
                    {sliderUrls.map((url, index) => (
                      <div key={index} className="flex-shrink-0 relative w-64 h-40 bg-gray-100 rounded-md overflow-hidden border">
                        <img
                          src={url}
                          alt={`Slider ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleDeleteSlider(index)}
                          disabled={deleting === `slider-${index}`}
                        >
                          {deleting === `slider-${index}` ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          წაშლა
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 bg-gray-100 rounded-md mb-4 border">
                    <p className="text-gray-400">სურათები არ არის ატვირთული</p>
                  </div>
                )}
              </div>

              <UploadForm
                title="Upload New Slider Images"
                description="These images will appear in the horizontal slider below the hero section."
                path="slider"
                onUploadComplete={handleSliderUpload}
                acceptMultiple={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="story">
          <Card className="bg-white shadow-lg border-2">
            <CardHeader>
              <CardTitle>Story Section Image</CardTitle>
            </CardHeader>
            <CardContent>
              {storySuccess && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    Story section image updated successfully!
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-2">Current Story Image</h3>
                  <div className="relative h-64 bg-gray-100 rounded-md overflow-hidden border">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : storyImage ? (
                      <>
                        <img src={storyImage} alt="Story" className="w-full h-full object-cover" />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleDeleteStory}
                          disabled={deleting === "story"}
                        >
                          {deleting === "story" ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          წაშლა
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400">სურათი არ არის ატვირთული</p>
                      </div>
                    )}
                  </div>
                </div>

                <UploadForm
                  title="Upload Story Image"
                  description="This image will appear in the Our Story section."
                  path="story"
                  onUploadComplete={handleStoryUpload}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="largePhoto">
          <Card className="bg-white shadow-lg border-2">
            <CardHeader>
              <CardTitle>Large Photo Below Story</CardTitle>
            </CardHeader>
            <CardContent>
              {largePhotoSuccess && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">Large photo updated successfully!</AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-2">Current Large Photo</h3>
                  <div className="relative h-64 bg-gray-100 rounded-md overflow-hidden border">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : largePhoto ? (
                      <>
                        <img src={largePhoto} alt="Large Photo" className="w-full h-full object-cover" />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleDeleteLargePhoto}
                          disabled={deleting === "largePhoto"}
                        >
                          {deleting === "largePhoto" ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          წაშლა
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400">სურათი არ არის ატვირთული</p>
                      </div>
                    )}
                  </div>
                </div>

                <UploadForm
                  title="Upload New Large Photo"
                  description="This large photo will appear below the Our Story section."
                  path="largePhoto"
                  onUploadComplete={handleLargePhotoUpload}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guestReview">
          <Card className="bg-white shadow-lg border-2">
            <CardHeader>
              <CardTitle>Guest Review Image</CardTitle>
            </CardHeader>
            <CardContent>
              {guestReviewSuccess && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">Guest review image updated successfully!</AlertDescription>
                </Alert>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium mb-2">Current Guest Review Image</h3>
                  <div className="relative h-64 bg-gray-100 rounded-md overflow-hidden border">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : guestReviewImage ? (
                      <>
                        <img src={guestReviewImage} alt="Guest Review" className="w-full h-full object-cover" />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleDeleteGuestReview}
                          disabled={deleting === "guestReview"}
                        >
                          {deleting === "guestReview" ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          წაშლა
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400">სურათი არ არის ატვირთული</p>
                      </div>
                    )}
                  </div>
                </div>

                <UploadForm
                  title="Upload New Guest Review Image"
                  description="This image will appear in the guest review section."
                  path="guestReview"
                  onUploadComplete={handleGuestReviewUpload}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seeDo">
          <Card className="bg-white shadow-lg border-2">
            <CardHeader>
              <CardTitle>See & Do Section</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <UploadForm
                  title="Upload See & Do Image"
                  description="This image will appear in the See & Do section."
                  path="seeDo"
                  onUploadComplete={handleSeeDoUpload}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}