"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Download, Loader2, RefreshCw, ExternalLink, Info, Folder, HardDrive } from "lucide-react"

export function DownloadButton({
  selectedDriveFolderId,
  dateFrom,
  dateTo,
  fileNameFilter,
  selectedFileType,
  selectedFolder,
}: {
  selectedDriveFolderId: string,
  dateFrom: string,
  dateTo: string,
  fileNameFilter?: string,
  selectedFileType?: string,
  selectedFolder?: string,
}) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [lastDownload, setLastDownload] = useState<{
    time: string
    gmailFolder?: string
    driveFolder?: string
    count: number
    dateRange?: string
    nameFilter?: string
    searchQuery?: string
  } | null>(null)
  const { toast } = useToast()

  // Reset download state on component mount
  useEffect(() => {
    setIsDownloading(false)
  }, [])

  const handleDownload = async () => {
    setIsDownloading(true)

    try {
      const payload = {
        drive_folder_id: selectedDriveFolderId, // or selectedFolderId
        date_from: dateFrom, // required, e.g., "2025-07-01"
        date_to: dateTo || null, // optional, null if not set
        file_name_filter: fileNameFilter,
        file_type: selectedFileType,
        gmail_folder: selectedFolder,
      };

      console.log("Payload being sent:", payload); // 🧪 Debug: See exactly what is sent

      const response = await fetch("/api/download-attachments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        setLastDownload({
          time: new Date().toLocaleString(),
          gmailFolder: result.gmailFolder,
          driveFolder: result.driveFolder,
          count: result.attachmentCount,
          dateRange: result.dateRange,
          nameFilter: result.nameFilter,
          searchQuery: result.searchQuery,
        })
        toast({
          title: "Upload Completed!",
          description: `Found ${result.emailCount} emails in "${result.gmailFolder}". Uploaded ${result.attachmentCount} matching attachments to "${result.driveFolder}".`,
        })
      } else {
        throw new Error(result.error || "Failed to start download")
      }
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const openGoogleDrive = () => {
    window.open("https://drive.google.com", "_blank")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Download & Upload Attachments</CardTitle>
        <CardDescription>
          Download filtered attachments from Gmail and upload to your selected Google Drive folder
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 mb-5">
        <Button onClick={handleDownload} disabled={isDownloading} className="w-full" size="lg">
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Emails...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download & Upload to Drive
            </>
          )}
        </Button>

        {lastDownload && (
          <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-center">
              <p className="text-sm font-medium text-green-800">Last upload: {lastDownload.time}</p>
              <p className="text-xs text-green-600">
                {lastDownload.count} files uploaded to "{lastDownload.driveFolder}"
              </p>
            </div>

            {(lastDownload.dateRange ||
              lastDownload.nameFilter !== "None" ||
              lastDownload.gmailFolder ||
              lastDownload.driveFolder) && (
              <div className="text-xs text-green-700 bg-green-100 p-2 rounded border">
                <div className="flex items-center gap-1 mb-1">
                  <Info className="h-3 w-3" />
                  <span className="font-medium">Upload Details:</span>
                </div>
                <p className="flex items-center gap-1">
                  <Folder className="h-3 w-3" />
                  Gmail Source: {lastDownload.gmailFolder}
                </p>
                <p className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  Drive Destination: {lastDownload.driveFolder}
                </p>
                <p>• Date Range: {lastDownload.dateRange}</p>
                <p>• Name Filter: {lastDownload.nameFilter}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1 bg-transparent"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Upload Again
              </Button>
              <Button variant="outline" size="sm" onClick={openGoogleDrive} className="flex-1 bg-transparent">
                <ExternalLink className="mr-2 h-3 w-3" />
                Open Drive
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Scans selected Gmail folder based on your filters</p>
          <p>• Downloads files matching your file type and name criteria</p>
          <p>• Uploads files to your chosen Google Drive folder</p>
          <p>• Creates detailed logs for tracking and access</p>
        </div>
      </CardContent>
    </Card>
  )
}
