import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  LogOut,
  Coffee,
  Menu,
  X,
  User,
  Tags,
  Layers,
  Store,
  Mail,
} from "lucide-react"
import { useAppDispatch } from "@/store/hooks"
import { logoutAdmin } from "@/store/slices/authSlice"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useState } from "react"
import { cn } from "@/lib/utils"

const AdminLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  const handleLogout = async () => {
    await dispatch(logoutAdmin())
    setLogoutOpen(false)
    toast.success("Logged out successfully")
    navigate("/")
  }

  const navItems = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/products", icon: Package, label: "Products" },
    { to: "/admin/categories", icon: Tags, label: "Categories" },
    { to: "/admin/combos", icon: Layers, label: "Combos" },
    { to: "/admin/orders", icon: ShoppingBag, label: "Orders" },
    { to: "/admin/messages", icon: Mail, label: "Messages" },
    { to: "/admin/cafe-settings", icon: Store, label: "Cafe Settings" },
    { to: "/admin/profile", icon: User, label: "Profile" },
  ]

  const isActive = (path: string) => {
    if (path === "/admin/dashboard") {
      return location.pathname === "/admin/dashboard"
    }
    return location.pathname.startsWith(path)
  }

  const NavLinks = () => (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {navItems.map((item) => {
        const active = isActive(item.to)
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Coffee className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="text-sm font-bold leading-none">Beaudesert</p>
              <p className="text-[11px] text-muted-foreground">Admin Panel</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <NavLinks />

        <div className="border-t p-3">
          <div className="flex items-center justify-between gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              className="flex-1 cursor-pointer"
              onClick={() => setLogoutOpen(true)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <Coffee className="h-5 w-5 text-primary" />
            Admin
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Do you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={handleLogout}
            >
              Yes, logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AdminLayout
