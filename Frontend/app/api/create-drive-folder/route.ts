import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { google } from "googleapis"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { folderName } = await request.json()

    if (!folderName) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    console.log("Creating Google Drive folder:", folderName, "for user:", session.user.email)

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

    // Check if folder already exists
    const existingFoldersResponse = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id,name)",
    })

    const existingFolders = existingFoldersResponse.data.files || []

    if (existingFolders.length > 0) {
      // Folder already exists, return the existing one
      const existingFolder = existingFolders[0]
      console.log("Folder already exists:", existingFolder.name, existingFolder.id)
      return NextResponse.json({
        success: true,
        folder: {
          id: existingFolder.id,
          name: existingFolder.name,
          createdTime: new Date().toISOString(),
          modifiedTime: new Date().toISOString(),
        },
        message: `Folder "${folderName}" already exists`,
      })
    }

    // Create new folder
    const folderMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }

    const folderResponse = await drive.files.create({
      requestBody: folderMetadata,
      fields: "id,name,createdTime,modifiedTime",
    })

    const newFolder = folderResponse.data

    console.log("Successfully created Drive folder:", newFolder.name, newFolder.id)

    return NextResponse.json({
      success: true,
      folder: {
        id: newFolder.id,
        name: newFolder.name,
        createdTime: newFolder.createdTime,
        modifiedTime: newFolder.modifiedTime,
      },
      message: `Successfully created folder "${folderName}"`,
    })
  } catch (error) {
    console.error("Create Drive folder error:", error)
    return NextResponse.json({ error: "Failed to create Google Drive folder. Please try again." }, { status: 500 })
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
