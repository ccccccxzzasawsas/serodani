'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function BookingPage() {
  const searchParams = useSearchParams()
  const checkInDate = searchParams.get('checkInDate')
  const checkOutDate = searchParams.get('checkOutDate')
  const roomType = searchParams.get('roomType')
  const isInitialized = useRef(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const lang = 'ka'
    const version = 'v2.1'

    const checkIn = checkInDate || undefined
    const checkOut = checkOutDate || undefined
    const roomTypeId = roomType || undefined

    const loadScript = (src: string, id?: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (id && document.getElementById(id)) return resolve()
        const script = document.createElement('script')
        if (id) script.id = id
        script.src = src
        script.async = true
        script.onload = () => resolve()
        script.onerror = reject
        document.body.appendChild(script)
      })
    }

    const loadStyle = (href: string): void => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
    }

    const initArealy = () => {
      if ((window as any).AR?.init) {
        ;(window as any).AR.init({
          checkInDate: checkIn,
          checkOutDate: checkOut,
          roomTypeId: roomTypeId,
          onGalleryOpen: (images: any) => {
            // @ts-ignore
            window.$.fancybox.open(images, {
              loop: false,
              thumbs: { autoStart: true },
            })
          },
          onGalleryLoad: () => {
            const iframe = document.querySelector('iframe')
            iframe?.contentWindow?.postMessage({ type: 'disable_fancybox' }, '*')
          },
        })
        setIsLoaded(true)
      }
    }

    // Step-by-step load
    Promise.all([
      loadScript('https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js'),
    ])
      .then(() => {
        loadStyle('https://assets.arealy.net/bookingengine/lib/jquery.fancybox.min.css')
        return loadScript('https://assets.arealy.net/bookingengine/lib/jquery.fancybox.min.js')
      })
      .then(() => {
        return loadScript(`https://assets.arealy.net/bookingengine/${lang}/${version}/sdk.min.js`, 'ar-sdk')
      })
      .then(() => {
        initArealy()
      })
      .catch((err) => {
        console.error('Error loading Arealy SDK:', err)
      })

    return () => {
      // Cleanup
      document.querySelectorAll('script[src*="arealy.net"], link[href*="arealy.net"]').forEach((el) =>
        el.parentNode?.removeChild(el)
      )
      delete (window as any).AR
      delete (window as any).fancyboxLoaded
      isInitialized.current = false
    }
  }, [checkInDate, checkOutDate, roomType])

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">დაჯავშნე შენზე მორგებულად</h1>

        <div className="relative h-[800px] bg-gray-50 border rounded-lg shadow-md overflow-hidden">
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80">
              <div className="text-gray-600 text-lg">იტვირთება ჯავშნის სისტემა...</div>
            </div>
          )}

          {/* Arealy Booking Placeholder */}
          <div id="ar-root" data-property="270" />
        </div>
      </div>
    </main>
  )
}
