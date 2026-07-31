import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import axios from "@/api/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import type { Category } from "@/types"

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: "", description: "", sortOrder: "0" })
  const [moving, setMoving] = useState<string | null>(null)

  const fetchCategories = async (silent = false) => {
    try {
      if (silent) setRefreshing(true)
      else setLoading(true)
      const res = await axios.get("/categories?all=true")
      const list = (res.data.data || []) as Category[]
      list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      setCategories(list)
    } catch {
      toast.error("Failed to load categories")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const openCreate = () => {
    setEditing(null)
    const nextOrder =
      categories.length === 0
        ? 0
        : Math.max(...categories.map((c) => c.sortOrder ?? 0)) + 1
    setForm({ name: "", description: "", sortOrder: String(nextOrder) })
    setDialogOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({
      name: cat.name,
      description: cat.description || "",
      sortOrder: String(cat.sortOrder ?? 0),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    try {
      if (editing) {
        await axios.put(`/categories/${editing._id}`, form)
        toast.success("Category updated")
      } else {
        await axios.post("/categories", form)
        toast.success("Category created")
      }
      setDialogOpen(false)
      fetchCategories()
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : "Save failed"
      toast.error(message)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await axios.delete(`/categories/${deleteId}`)
      toast.success("Category deleted")
      setDeleteId(null)
      fetchCategories()
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : "Delete failed"
      toast.error(message)
    }
  }

  /** Swap sort order with neighbor — controls menu filter order */
  const moveCategory = async (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1
    if (target < 0 || target >= categories.length) return

    const current = categories[index]
    const neighbor = categories[target]
    const currentOrder = current.sortOrder ?? index
    const neighborOrder = neighbor.sortOrder ?? target

    try {
      setMoving(current._id)
      await Promise.all([
        axios.put(`/categories/${current._id}`, {
          name: current.name,
          description: current.description || "",
          sortOrder: neighborOrder,
        }),
        axios.put(`/categories/${neighbor._id}`, {
          name: neighbor.name,
          description: neighbor.description || "",
          sortOrder: currentOrder,
        }),
      ])
      await fetchCategories()
    } catch {
      toast.error("Failed to reorder")
    } finally {
      setMoving(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Display order controls how categories appear in the customer menu
            filters. Lower numbers show first. Use the arrows or edit the number.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="cursor-pointer"
            disabled={loading || refreshing}
            onClick={() => fetchCategories(true)}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button className="cursor-pointer" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[100px]">Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Slug</TableHead>
                <TableHead className="hidden md:table-cell">
                  Description
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    No categories yet
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence mode="popLayout">
                  {categories.map((cat, index) => (
                    <motion.tr
                      key={cat._id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="border-b"
                    >
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="w-6 text-center text-sm font-semibold tabular-nums">
                            {cat.sortOrder ?? 0}
                          </span>
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="h-6 w-6 cursor-pointer"
                              disabled={index === 0 || moving === cat._id}
                              onClick={() => moveCategory(index, "up")}
                              title="Move up (show earlier)"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="h-6 w-6 cursor-pointer"
                              disabled={
                                index === categories.length - 1 ||
                                moving === cat._id
                              }
                              onClick={() => moveCategory(index, "down")}
                              title="Move down (show later)"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="hidden font-mono text-xs sm:table-cell">
                        {cat.slug}
                      </TableCell>
                      <TableCell className="hidden max-w-xs truncate md:table-cell">
                        {cat.description || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer"
                          onClick={() => openEdit(cat)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer text-destructive"
                          onClick={() => setDeleteId(cat._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              Categories group products on the menu. Display order decides which
              filter tab appears first for customers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Coffee"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Hot & cold drinks"
              />
            </div>
            <div className="space-y-2">
              <Label>Display order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Lower number = appears first in menu filters (0 before 1, 2…).
                You can also use the ↑ ↓ arrows in the table.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="cursor-pointer" onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Products using this category must be
              reassigned first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Categories
