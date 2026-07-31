import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import axios from "@/api/axios"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Mail,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import type { ContactMessage } from "@/types"

type Meta = {
  page: number
  limit: number
  total: number
  totalPages: number
  unread: number
}

const Messages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [meta, setMeta] = useState<Meta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    unread: 0,
  })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchMessages = async (silent = false) => {
    try {
      if (silent) setRefreshing(true)
      else setLoading(true)
      const res = await axios.get("/contact", { params: { page, limit: 20 } })
      setMessages(res.data.data || [])
      if (res.data.meta) setMeta(res.data.meta)
    } catch {
      toast.error("Failed to load messages")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const openMessage = async (msg: ContactMessage) => {
    setSelected(msg)
    setDialogOpen(true)
    if (!msg.isRead) {
      try {
        await axios.patch(`/contact/${msg._id}/read`)
        setMessages((prev) =>
          prev.map((m) => (m._id === msg._id ? { ...m, isRead: true } : m))
        )
        setMeta((m) => ({ ...m, unread: Math.max(0, m.unread - 1) }))
      } catch {
        /* ignore */
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/contact/${id}`)
      toast.success("Message deleted")
      if (selected?._id === id) {
        setDialogOpen(false)
        setSelected(null)
      }
      fetchMessages()
    } catch {
      toast.error("Failed to delete message")
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contact form submissions from customers
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="cursor-pointer"
            disabled={loading || refreshing}
            onClick={() => fetchMessages(true)}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <div className="flex items-center gap-3 rounded-xl border bg-primary/5 px-4 py-2">
            <Mail className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Unread</span>
            <span className="text-xl font-bold text-primary">
              {loading ? "..." : meta.unread}
            </span>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>From</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </TableCell>
                </TableRow>
              ) : messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <Mail className="mx-auto mb-2 h-10 w-10 opacity-30" />
                    <p className="font-medium">No messages yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((msg) => (
                  <TableRow
                    key={msg._id}
                    className={!msg.isRead ? "bg-primary/5" : undefined}
                  >
                    <TableCell className="font-medium">{msg.name}</TableCell>
                    <TableCell className="text-sm">{msg.email}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                      {msg.message}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell>
                      {msg.isRead ? (
                        <Badge variant="secondary">Read</Badge>
                      ) : (
                        <Badge>New</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => openMessage(msg)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="cursor-pointer text-destructive hover:text-destructive"
                          onClick={() => handleDelete(msg._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {meta.page} of {meta.totalPages} · {meta.total} total
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="pr-2">Message</DialogTitle>
            <DialogDescription>
              {selected
                ? new Date(selected.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="font-medium">{selected.name}</p>
                <a
                  href={`mailto:${selected.email}`}
                  className="cursor-pointer text-sm text-primary hover:underline"
                >
                  {selected.email}
                </a>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {selected.message}
              </div>
              <Button
                variant="destructive"
                className="cursor-pointer"
                onClick={() => handleDelete(selected._id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete message
              </Button>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Messages
