"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { Home, ImageIcon, Bed, UtensilsCrossed, Wine, LogOut, Calendar } from "lucide-react"

export function AdminNav() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="bg-gray-800 text-white h-screen w-64 fixed left-0 top-0 overflow-y-auto">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">სეროდანი ადმინი</h2>
        <p className="text-gray-400 text-sm">სასტუმროს მართვა</p>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <Link href="/admin/dashboard">
              <Button variant={isActive("/admin/dashboard") ? "default" : "ghost"} className="w-full justify-start">
                <Home className="mr-2 h-4 w-4" />
                მთავარი პანელი
              </Button>
            </Link>
          </li>
          <li>
            <Link href="/admin/home-page">
              <Button variant={isActive("/admin/home-page") ? "default" : "ghost"} className="w-full justify-start">
                <Home className="mr-2 h-4 w-4" />
                მთავარი გვერდი
              </Button>
            </Link>
          </li>
          <li>
            <Link href="/admin/rooms">
              <Button 
                variant={isActive("/admin/rooms") || pathname.startsWith("/admin/rooms/") ? "default" : "ghost"} 
                className="w-full justify-start"
              >
                <Bed className="mr-2 h-4 w-4" />
                ოთახები
              </Button>
            </Link>
          </li>
          <li>
            <Link href="/admin/dashboard/bookings">
              <Button variant={isActive("/admin/dashboard/bookings") ? "default" : "ghost"} className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                ჯავშნები
              </Button>
            </Link>
          </li>
          <li>
            <Link href="/admin/gallery">
              <Button variant={isActive("/admin/gallery") ? "default" : "ghost"} className="w-full justify-start">
                <ImageIcon className="mr-2 h-4 w-4" />
                გალერეა
              </Button>
            </Link>
          </li>
          <li>
            <Link href="/admin/dining">
              <Button variant={isActive("/admin/dining") ? "default" : "ghost"} className="w-full justify-start">
                <UtensilsCrossed className="mr-2 h-4 w-4" />
                რესტორანი
              </Button>
            </Link>
          </li>
          <li>
            <Link href="/admin/wines">
              <Button variant={isActive("/admin/wines") ? "default" : "ghost"} className="w-full justify-start">
                <Wine className="mr-2 h-4 w-4" />
                მარანი და ღვინო
              </Button>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          გასვლა
        </Button>
      </div>
    </div>
  )
}
