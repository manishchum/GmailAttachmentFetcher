import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { google } from "googleapis"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Fetching Google Drive folders for:", session.user.email)

    // Get user's tokens from Supabase
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("access_token, refresh_token, token_expires_at")
      .eq("email", session.user.email)
      .single()

    if (userError || !userData) {
      console.error("User fetch error:", userError)
      return NextResponse.json({ error: "User not found. Please sign in again." }, { status: 400 })
    }

    if (!userData.access_token) {
      return NextResponse.json(
        {
          error: "No access token found. Please sign out and sign in again to reconnect your Google account.",
        },
        { status: 401 },
      )
    }

    // Check if token is expired and refresh if needed
    let currentAccessToken = userData.access_token
    if (userData.token_expires_at) {
      const tokenExpiresAt = new Date(userData.token_expires_at)
      const now = new Date()

      if (tokenExpiresAt <= now && userData.refresh_token) {
        console.log("Token expired, refreshing...")
        const refreshResult = await refreshUserToken(session.user.email, userData.refresh_token)
        if (!refreshResult.success) {
          return NextResponse.json(
            {
              error: "Token expired and refresh failed. Please sign out and sign in again.",
            },
            { status: 401 },
          )
        }
        currentAccessToken = refreshResult.accessToken
      }
    }

    // Initialize Google Drive API
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: currentAccessToken })

    const drive = google.drive({ version: "v3", auth: oauth2Client })

    // Test Drive API access
    try {
      await drive.about.get({ fields: "user" })
      console.log("Google Drive API access confirmed")
    } catch (driveError) {
      console.error("Google Drive API access failed:", driveError)
      return NextResponse.json(
        {
          error: "Google Drive API access failed. Please sign out and sign in again.",
        },
        { status: 401 },
      )
    }

    // Fetch Drive folders
    const foldersResponse = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: "files(id, name, parents, modifiedTime)",
    })

    const folders = foldersResponse.data.files || []

    // Format folders for display
    const formattedFolders = folders.map((folder) => ({
      id: folder.id!,
      name: folder.name!,
      parents: folder.parents || [],
      createdTime: folder.createdTime!,
      modifiedTime: folder.modifiedTime!,
    }))

    // Sort folders: root folders first, then by modification date
    formattedFolders.sort((a, b) => {
      // Root folders (no parents or parent is root) come first
      const aIsRoot = !a.parents || a.parents.length === 0 || a.parents.includes("0AHy8P6XkNdKbUk9PVA")
      const bIsRoot = !b.parents || b.parents.length === 0 || b.parents.includes("0AHy8P6XkNdKbUk9PVA")

      if (aIsRoot && !bIsRoot) return -1
      if (!aIsRoot && bIsRoot) return 1

      // Then sort by modification date (newest first)
      return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
    })

    console.log(`Found ${formattedFolders.length} Google Drive folders`)

    return NextResponse.json({
      success: true,
      folders: formattedFolders,
      totalFolders: formattedFolders.length,
    })
  } catch (error) {
    console.error("Google Drive folders fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch Google Drive folders. Please try again." }, { status: 500 })
  }
}

// Helper function to refresh user token
async function refreshUserToken(email: string, refreshToken: string) {
  try {
    console.log("Refreshing token for user:", email)

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      console.error("Token refresh failed:", refreshedTokens)
      return { success: false }
    }

    const newExpiresAt = new Date(Date.now() + refreshedTokens.expires_in * 1000)

    // Update tokens in Supabase
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        access_token: refreshedTokens.access_token,
        refresh_token: refreshedTokens.refresh_token || refreshToken,
        token_expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("email", email)

    if (error) {
      console.error("Error updating refreshed tokens:", error)
      return { success: false }
    }

    console.log("Successfully refreshed and updated tokens")
    return { success: true, accessToken: refreshedTokens.access_token }
  } catch (error) {
    console.error("Error refreshing token:", error)
    return { success: false }
  }
}
