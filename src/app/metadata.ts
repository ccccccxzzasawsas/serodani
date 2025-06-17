import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hotel in Kakheti – Serodani | Cottage Stay in Telavi",
  description: "Book your nature stay at a boutique wine hotel in Kakheti. Wooden cottages, fresh air, and Georgian hospitality in the heart of Telavi.",
  keywords: "Hotel in Kakheti, Best Hotels in Kakheti, Kakheti boutique hotel, Nature hotel in Georgia, Cottage stay Kakheti, Wooden cottages in Georgia, Cottage in Kakheti, Georgian countryside hotel, Wine hotel Georgia, Hotels in Telavi, Where to stay in Kakheti, Relaxing weekend getaway from Tbilisi",
  icons: {
    icon: '/faction.jpg',
    apple: '/faction.jpg',
  },
  openGraph: {
    title: "Hotel in Kakheti – Serodani | Cottage Stay in Telavi",
    description: "Book your nature stay at a boutique wine hotel in Kakheti. Wooden cottages, fresh air, and Georgian hospitality in the heart of Telavi.",
    type: "website",
    images: [
      {
        url: '/faction.jpg',
        width: 800,
        height: 600,
        alt: 'Hotel Serodani Faction',
      },
    ],
  },
  twitter: {
    title: "Hotel in Kakheti – Serodani | Cottage Stay in Telavi",
    description: "Book your nature stay at a boutique wine hotel in Kakheti. Wooden cottages, fresh air, and Georgian hospitality in the heart of Telavi.",
    card: "summary_large_image",
    images: ['/faction.jpg'],
  },
} 