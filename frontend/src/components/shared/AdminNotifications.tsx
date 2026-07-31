import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import axios from "@/api/axios"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bell, CheckCheck, ShoppingBag, Mail } from "lucide-react"
import { toast } from "sonner"

type AdminNotification = {
  _id: string
  type: "order" | "message" | "feedback"
  title: string
  body: string
  link: string
  relatedId?: string | null
  isRead: boolean
  createdAt: string
}

const POLL_MS = 45_000

export function AdminNotifications() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [markingAll, setMarkingAll] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const pausedUntilRef = useRef(0)

  const fetchNotifications = useCallback(async () => {
    if (Date.now() < pausedUntilRef.current) return
    if (typeof document !== "undefined" && document.hidden) return
    try {
      const res = await axios.get("/admin/notifications", {
        params: { limit: 30 },
      })
      setItems(res.data.data?.items || [])
      setUnreadCount(res.data.data?.unreadCount || 0)
    } catch (error: unknown) {
      // Back off hard on rate-limit so we don't spam 429s
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        pausedUntilRef.current = Date.now() + 60_000
      }
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const id = window.setInterval(fetchNotifications, POLL_MS)
    const onVisible = () => {
      if (!document.hidden) fetchNotifications()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [fetchNotifications])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  const markReadAndGo = async (n: AdminNotification) => {
    try {
      if (!n.isRead) {
        // PUT avoids some CORS preflight Method issues with PATCH
        await axios.put(`/admin/notifications/${n._id}/read`)
        setItems((prev) =>
          prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      }
    } catch {
      /* still navigate */
    }
    setOpen(false)
    navigate(n.link || "/admin/orders")
  }

  const markAll = async () => {
    try {
      setMarkingAll(true)
      await axios.put("/admin/notifications/read-all")
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })))
      setUnreadCount(0)
      toast.success("All notifications marked as read")
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : "Could not mark notifications as read"
      toast.error(message)
    } finally {
      setMarkingAll(false)
    }
  }

  const visible = items.filter((n) => !n.isRead)

  return (
    <div className="relative" ref={panelRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative cursor-pointer"
        aria-label="Notifications"
        onClick={() => {
          setOpen((o) => !o)
          if (!open) fetchNotifications()
        }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute top-full right-0 z-50 mt-2 w-[min(100vw-2rem,320px)] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10"
          >
            <div className="flex items-center justify-between border-b px-3 py-2.5">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  disabled={markingAll}
                  className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                  onClick={markAll}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  {markingAll ? "Marking…" : "Mark all read"}
                </button>
              )}
            </div>
            <div className="scrollbar-thin-theme max-h-72 overflow-y-auto">
              {visible.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  You're all caught up
                </p>
              ) : (
                visible.map((n) => (
                  <button
                    key={n._id}
                    type="button"
                    className={cn(
                      "flex w-full cursor-pointer gap-2.5 border-b px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-muted/50",
                      !n.isRead && "bg-primary/5"
                    )}
                    onClick={() => markReadAndGo(n)}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        n.type === "order"
                          ? "bg-green-500/10 text-green-600"
                          : "bg-blue-500/10 text-blue-600"
                      )}
                    >
                      {n.type === "order" ? (
                        <ShoppingBag className="h-4 w-4" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </span>
                    {!n.isRead && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
