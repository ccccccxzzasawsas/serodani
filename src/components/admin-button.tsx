"use client"

import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export function AdminButton() {
  const { user, isAdmin } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !user || !isAdmin) {
    return null
  }

  // Use different styles for mobile vs desktop
  return (
    <Link href="/admin/dashboard">
      <Button
        variant="outline"
        size="sm"
        className="hidden md:flex md:fixed md:top-4 md:right-4 z-[100] bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-gray-100 shadow-md"
      >
        <Settings className="mr-2 h-4 w-4" />
        Admin Panel
      </Button>
    </Link>
  )
}
