import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchMenu, deleteMenuItem } from "@/store/slices/menuSlice"
import axios from "@/api/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
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
import { formatPrice } from "@/lib/formatPrice"
import { Trash2, Layers } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const Combos = () => {
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((state) => state.menu)
  const [comboMode, setComboMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    comboPrice: "",
  })

  useEffect(() => {
    dispatch(fetchMenu({ includeUnavailable: true }))
  }, [dispatch])

  const normalItems = useMemo(
    () => items.filter((i) => (i.productType || "normal") === "normal"),
    [items]
  )
  const comboItems = useMemo(
    () => items.filter((i) => i.productType === "combo"),
    [items]
  )

  const selectedProducts = normalItems.filter((i) =>
    selectedIds.includes(i._id)
  )

  const estimatedOriginal = selectedProducts.reduce((sum, p) => {
    const price =
      p.hasVariants && p.variants?.length
        ? p.variants.find((v) => v.isDefault)?.price || p.variants[0].price
        : p.price
    return sum + price
  }, 0)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const openReadyDialog = () => {
    if (selectedIds.length < 2) {
      toast.error("Select at least 2 products")
      return
    }
    setForm({
      name: "",
      description: "",
      comboPrice: estimatedOriginal.toFixed(2),
    })
    setImage(null)
    setDialogOpen(true)
  }

  const handleCreateCombo = async () => {
    if (!form.name || !form.description || !form.comboPrice || !image) {
      toast.error("Fill all fields and upload an image")
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append("name", form.name)
      fd.append("description", form.description)
      fd.append("comboPrice", form.comboPrice)
      fd.append(
        "comboItems",
        JSON.stringify(
          selectedProducts.map((p) => ({
            id: p._id,
            quantity: 1,
            variantLabel: p.hasVariants
              ? p.variants?.find((v) => v.isDefault)?.label ||
                p.variants?.[0]?.label
              : null,
          }))
        )
      )
      fd.append("image", image)
      await axios.post("/menu/combo", fd)
      toast.success("Combo created")
      setDialogOpen(false)
      setComboMode(false)
      setSelectedIds([])
      dispatch(fetchMenu({ includeUnavailable: true }))
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : "Failed to create combo"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await dispatch(deleteMenuItem(deleteId))
    toast.success("Combo deleted")
    setDeleteId(null)
  }

  const includesLabel = (item: (typeof comboItems)[0]) => {
    if (!item.comboItems?.length) return "—"
    return item.comboItems
      .map((ci) => {
        const name =
          typeof ci.item === "object" && ci.item ? ci.item.name : "Item"
        return `${ci.quantity}× ${name}`
      })
      .join(", ")
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Combos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bundle products into combo packs with a special price
          </p>
        </div>
        <Button
          className="cursor-pointer"
          variant={comboMode ? "secondary" : "default"}
          onClick={() => {
            setComboMode((v) => !v)
            setSelectedIds([])
          }}
        >
          <Layers className="mr-2 h-4 w-4" />
          {comboMode ? "Cancel Selection" : "Make Combo"}
        </Button>
      </div>

      {comboMode && (
        <div className="mb-4 space-y-4">
          {selectedIds.length >= 2 && (
            <div className="sticky top-0 z-10 flex flex-col gap-2 rounded-xl border bg-background p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium">
                {selectedIds.length} products · Estimate{" "}
                {formatPrice(estimatedOriginal)}
              </span>
              <Button className="cursor-pointer" onClick={openReadyDialog}>
                Ready for Combo
              </Button>
            </div>
          )}

          <Card className="overflow-hidden border shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12" />
                    <TableHead>Image</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Description
                    </TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {normalItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(item._id)}
                          onCheckedChange={() => toggleSelect(item._id)}
                          className="cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-12 w-12 rounded-lg object-contain bg-muted/40"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="hidden max-w-[220px] truncate text-sm text-muted-foreground sm:table-cell">
                        {item.description || "—"}
                      </TableCell>
                      <TableCell>{formatPrice(item.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {!comboMode && (
        <Card className="overflow-hidden border shadow-sm">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Description
                  </TableHead>
                  <TableHead>Includes</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </TableCell>
                  </TableRow>
                ) : comboItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <Layers className="mx-auto mb-2 h-10 w-10 opacity-30" />
                      <p className="font-medium">No combos yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Click &quot;Make Combo&quot; to create one
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {comboItems.map((item, i) => {
                      const available = item.isAvailable !== false
                      return (
                        <motion.tr
                          key={item._id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.25,
                            delay: Math.min(i * 0.04, 0.2),
                          }}
                          className={cn(
                            "border-b",
                            !available && "opacity-60"
                          )}
                        >
                          <TableCell>
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-14 w-14 rounded-lg object-contain bg-muted/40"
                            />
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold">{item.name}</p>
                            <Badge
                              className="mt-1"
                              variant="secondary"
                            >
                              Combo
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden max-w-[240px] md:table-cell">
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {item.description || "—"}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {includesLabel(item)}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="font-bold text-primary">
                              {formatPrice(item.price)}
                            </p>
                            {item.originalPrice != null &&
                              item.originalPrice > item.price && (
                                <p className="text-xs text-muted-foreground line-through">
                                  {formatPrice(item.originalPrice)}
                                </p>
                              )}
                          </TableCell>
                          <TableCell>
                            {available ? (
                              <Badge className="bg-emerald-600 text-white">
                                In stock
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Out of stock</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="cursor-pointer text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(item._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Combo Pack</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-3 text-sm">
              <p className="mb-2 font-medium">Selected items</p>
              <ul className="space-y-1 text-muted-foreground">
                {selectedProducts.map((p) => (
                  <li key={p._id}>
                    {p.name} — {formatPrice(p.price)}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs">
                Original total: {formatPrice(estimatedOriginal)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Combo Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Combo Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.comboPrice}
                onChange={(e) =>
                  setForm({ ...form, comboPrice: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <Input
                type="file"
                accept="image/*"
                className="cursor-pointer"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
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
            <Button
              className="cursor-pointer"
              onClick={handleCreateCombo}
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Combo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete combo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the combo pack.
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

export default Combos
