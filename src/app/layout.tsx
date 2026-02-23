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
          href="/serodani-logo.svg" 
          type="image/svg+xml"
        />
        <link 
          rel="apple-touch-icon" 
          href="/serodani-logo.svg"
        />
        <meta name="keywords" content="Hotel in Kakheti, Best Hotels in Kakheti, Kakheti boutique hotel, Nature hotel in Georgia, Cottage stay Kakheti, Wooden cottages in Georgia, Cottage in Kakheti, Georgian countryside hotel, Wine hotel Georgia, Hotels in Telavi, Where to stay in Kakheti, Relaxing weekend getaway from Tbilisi, სასტუმროები კახეთში, კოტეჯები კახეთში, საუკეთესო სასტუმრო კახეთში, სასტუმრო კახეთში აუზით, Sastumro kaxetshi, Koteji kaxetshi, Sastumro kaxetshi auzit, Sauketeso sastumroebi kaxetshi" />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var n=function(){};console.log=n;console.info=n;console.debug=n;console.warn=n;console.error=n;})();`,
          }}
        />
        <div className="sr-only">
          სასტუმროები კახეთში, კოტეჯები კახეთში, საუკეთესო სასტუმრო კახეთში, სასტუმრო კახეთში აუზით, Sastumro kaxetshi, Koteji kaxetshi, Sastumro kaxetshi auzit, Sauketeso sastumroebi kaxetshi
        </div>
        {children}
      </body>
    </html>
  )
}
