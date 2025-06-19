import type React from "react"
import "./globals.css"
import { metadata } from "./metadata"

export { metadata }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="preconnect" 
          href="https://firebasestorage.googleapis.com" 
          crossOrigin="anonymous"
        />
        <link 
          rel="dns-prefetch" 
          href="https://firebasestorage.googleapis.com"
        />
        <link 
          rel="icon" 
          href="https://hotelserodani.com/faction.jpg" 
          type="image/jpeg"
        />
        <link 
          rel="apple-touch-icon" 
          href="https://hotelserodani.com/faction.jpg"
        />
        <meta name="keywords" content="Hotel in Kakheti, Best Hotels in Kakheti, Kakheti boutique hotel, Nature hotel in Georgia, Cottage stay Kakheti, Wooden cottages in Georgia, Cottage in Kakheti, Georgian countryside hotel, Wine hotel Georgia, Hotels in Telavi, Where to stay in Kakheti, Relaxing weekend getaway from Tbilisi, სასტუმროები კახეთში, კოტეჯები კახეთში, საუკეთესო სასტუმრო კახეთში, სასტუმრო კახეთში აუზით, Sastumro kaxetshi, Koteji kaxetshi, Sastumro kaxetshi auzit, Sauketeso sastumroebi kaxetshi" />
      </head>
      <body>
        <div className="sr-only">
          სასტუმროები კახეთში, კოტეჯები კახეთში, საუკეთესო სასტუმრო კახეთში, სასტუმრო კახეთში აუზით, Sastumro kaxetshi, Koteji kaxetshi, Sastumro kaxetshi auzit, Sauketeso sastumroebi kaxetshi
        </div>
        {children}
      </body>
    </html>
  )
}
