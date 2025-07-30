"use client"

import { Home, FileText, LogOut, Menu } from "lucide-react"
import { signOut } from "next-auth/react"
import { useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Download Logs",
    url: "/logs",
    icon: FileText,
  },
]

export function AppSidebar() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { openMobile, setOpenMobile, isMobile } = useSidebar()

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut({
        callbackUrl: "/",
        redirect: true,
      })
    } catch (error) {
      console.error("Sign out error:", error)
      setIsSigningOut(false)
    }
  }

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setOpenMobile(!openMobile)}
          className="fixed top-4 left-4 z-40 p-2 bg-white rounded-md shadow-md sm:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}
      <Sidebar className={isMobile ? 'fixed left-0 top-0 z-30' : ''}>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <img src="/Logo.png" alt="Logo" className="h-6 w-6" />
            <h2 className="text-lg font-semibold">FetchFloww</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut} disabled={isSigningOut}>
                <LogOut />
                <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}
