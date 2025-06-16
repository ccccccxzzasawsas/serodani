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

  return (
    <Link href="/admin/dashboard">
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 md:top-4 md:right-4 md:left-auto z-[100] bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-gray-100 shadow-md"
      >
        <Settings className="mr-2 h-4 w-4" />
        Admin Panel
      </Button>
    </Link>
  )
}
