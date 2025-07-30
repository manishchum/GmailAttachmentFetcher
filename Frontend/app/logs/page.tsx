"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { LogsTable } from "@/components/logs-table"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"

export default function LogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading logs...</span>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Redirecting to login...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Download Logs</h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 mb-7">
          {/* Add a date picker for dateTo if you want UI control */}
          <LogsTable userEmail={session?.user?.email || ""} dateTo={dateTo} />
        </div>
      </SidebarInset>
    </>
  )
}
