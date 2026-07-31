import { useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  LogOut,
  Coffee,
  User,
  Tags,
  Layers,
  Store,
  Mail,
  ChevronsUpDown,
} from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { logoutAdmin } from "@/store/slices/authSlice"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { resolveMediaUrl } from "@/lib/mediaUrl"
import { toast } from "sonner"
import { useState } from "react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/products", icon: Package, label: "Products" },
  { to: "/admin/categories", icon: Tags, label: "Categories" },
  { to: "/admin/combos", icon: Layers, label: "Combos" },
  { to: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  { to: "/admin/messages", icon: Mail, label: "Messages" },
  { to: "/admin/cafe-settings", icon: Store, label: "Cafe Settings" },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { admin } = useAppSelector((s) => s.auth)
  const { isMobile, setOpenMobile, state } = useSidebar()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === "/admin/dashboard") {
      return location.pathname === "/admin/dashboard"
    }
    return location.pathname.startsWith(path)
  }

  const go = (path: string) => {
    if (isMobile) setOpenMobile(false)
    setAccountOpen(false)
    navigate(path)
  }

  const handleLogout = async () => {
    await dispatch(logoutAdmin())
    setLogoutOpen(false)
    setAccountOpen(false)
    toast.success("Logged out successfully")
    navigate("/")
  }

  const initials = (admin?.name || admin?.email || "A")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const avatarSrc = admin?.avatar ? resolveMediaUrl(admin.avatar) : ""

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader className="border-b border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip="Beaudesert Cafe"
                className="cursor-pointer"
                onClick={() => go("/")}
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                  <Coffee className="size-4" />
                </span>
                <span className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-tight">
                    Beaudesert
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Admin Panel
                  </span>
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Manage</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5 px-1">
                {navItems.map((item) => {
                  const active = isActive(item.to)
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.label}
                        className={cn(
                          "h-10 cursor-pointer rounded-lg transition-colors",
                          active &&
                            "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground data-active:bg-primary data-active:text-primary-foreground"
                        )}
                        onClick={() => go(item.to)}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen}>
                <DropdownMenuTrigger
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 overflow-hidden rounded-lg p-2 text-left text-sm outline-none",
                    "ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "focus-visible:ring-2 data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground",
                    "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2!"
                  )}
                >
                  <Avatar className="size-8 rounded-lg">
                    {avatarSrc ? (
                      <AvatarImage src={avatarSrc} alt={admin?.name || "Admin"} />
                    ) : null}
                    <AvatarFallback className="rounded-lg bg-primary/15 font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "grid min-w-0 flex-1 text-left text-sm leading-tight",
                      state === "collapsed" && "sr-only"
                    )}
                  >
                    <span className="truncate font-semibold">
                      {admin?.name || "Admin"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {admin?.email || "—"}
                    </span>
                  </span>
                  <ChevronsUpDown
                    className={cn(
                      "ml-auto size-4 shrink-0 text-muted-foreground",
                      state === "collapsed" && "hidden"
                    )}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 rounded-xl"
                  side="top"
                  align="end"
                  sideOffset={10}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1.5 py-2 text-left text-sm">
                        <Avatar className="size-9 rounded-lg">
                          {avatarSrc ? (
                            <AvatarImage
                              src={avatarSrc}
                              alt={admin?.name || "Admin"}
                            />
                          ) : null}
                          <AvatarFallback className="rounded-lg bg-primary/15 font-semibold text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">
                            {admin?.name || "Admin"}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {admin?.email || "—"}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => go("/admin/profile")}
                    >
                      <User />
                      Profile
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={() => {
                        setAccountOpen(false)
                        setLogoutOpen(true)
                      }}
                    >
                      <LogOut />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

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
    </>
  )
}
