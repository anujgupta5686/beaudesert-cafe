import { useEffect } from "react"
import { Outlet } from "react-router-dom"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/admin/AppSidebar"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { AdminNotifications } from "@/components/shared/AdminNotifications"
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"
import axios from "@/api/axios"

const AdminLayout = () => {
  const isMobile = useIsMobile()

  // Detect single-device logout while admin keeps the tab open
  useEffect(() => {
    const ping = () => {
      if (!localStorage.getItem("adminToken")) return
      axios.get("/admin/profile").catch(() => {
        /* 401 handled by axios interceptor → login */
      })
    }
    ping()
    const id = window.setInterval(ping, 45_000)
    const onFocus = () => ping()
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") ping()
    })
    return () => {
      window.clearInterval(id)
      window.removeEventListener("focus", onFocus)
    }
  }, [])

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-4">
          <SidebarTrigger className="cursor-pointer touch-manipulation" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
            <ThemeToggle />
            <AdminNotifications />
          </div>
        </header>
        <main className="scrollbar-thin-theme flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AdminLayout
