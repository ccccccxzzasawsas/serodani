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
          href="/favicon.ico" 
          type="image/x-icon"
        />
        <link 
          rel="shortcut icon" 
          href="/favicon.ico" 
          type="image/x-icon"
        />
        <link 
          rel="apple-touch-icon" 
          href="/faction.jpg"
        />
        <meta name="keywords" content="Hotel in Kakheti, Best Hotels in Kakheti, Kakheti boutique hotel, Nature hotel in Georgia, Cottage stay Kakheti, Wooden cottages in Georgia, Cottage in Kakheti, Georgian countryside hotel, Wine hotel Georgia, Hotels in Telavi, Where to stay in Kakheti, Relaxing weekend getaway from Tbilisi" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
