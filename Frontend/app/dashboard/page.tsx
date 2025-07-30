"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { FileTypeSelector } from "@/components/file-type-selector"
import { UserCard } from "@/components/user-card"
import { Separator } from "@/components/ui/separator"
import { DownloadButton } from "@/components/download-button"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // LIFTED STATE
  const [selectedFileType, setSelectedFileType] = useState<string>("")
  const [fileNameFilter, setFileNameFilter] = useState<string>("")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const [selectedDriveFolder, setSelectedDriveFolder] = useState<string>("")

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
          <span>Loading dashboard...</span>
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
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <FileTypeSelector
                selectedFileType={selectedFileType}
                setSelectedFileType={setSelectedFileType}
                fileNameFilter={fileNameFilter}
                setFileNameFilter={setFileNameFilter}
                dateFrom={dateFrom}
                setDateFrom={setDateFrom}
                dateTo={dateTo}
                setDateTo={setDateTo}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                selectedDriveFolder={selectedDriveFolder}
                setSelectedDriveFolder={setSelectedDriveFolder}
              />
              <DownloadButton
                selectedDriveFolderId={selectedDriveFolder}
                dateFrom={dateFrom}
                dateTo={dateTo}
                fileNameFilter={fileNameFilter}
                selectedFileType={selectedFileType}
                selectedFolder={selectedFolder}
              />
            </div>
            <div>
              <UserCard user={session?.user} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}
