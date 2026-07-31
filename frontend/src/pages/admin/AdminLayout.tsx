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

const AdminLayout = () => {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
          <SidebarTrigger className="cursor-pointer" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <div className="flex flex-1 items-center justify-end gap-1">
            <ThemeToggle />
            <AdminNotifications />
          </div>
        </header>
        <main className="scrollbar-thin-theme flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AdminLayout
