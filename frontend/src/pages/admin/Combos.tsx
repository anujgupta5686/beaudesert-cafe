import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  useCreateComboMutation,
  useDeleteProductMutation,
  useMenuQuery,
  useUpdateComboMutation,
} from "@/hooks/useMenuQueries"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatPrice } from "@/lib/formatPrice"
import { Image as ImageIcon, Loader2, Trash2, Layers, Upload, X, Pencil } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { MenuItem } from "@/types"
import axios from "axios"
import { getProductImages } from "@/lib/productImages"

type ComboPick = {
  id: string
  quantity: number
  variantLabel: string | null
}

type PreviewItem =
  | { kind: "existing"; url: string }
  | { kind: "file"; file: File; url: string }

const MAX_IMAGES = 6

const Combos = () => {
  const { data: items = [], isLoading, isFetching, refetch } = useMenuQuery({
    includeUnavailable: true,
  })
  const createCombo = useCreateComboMutation()
  const updateCombo = useUpdateComboMutation()
  const deleteProduct = useDeleteProductMutation()

  const [comboMode, setComboMode] = useState(false)
  const [picks, setPicks] = useState<Record<string, ComboPick>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [previews, setPreviews] = useState<PreviewItem[]>([])
  const [form, setForm] = useState({
    name: "",
    description: "",
    comboPrice: "",
  })

  const clearPreviews = () => {
    setPreviews((prev) => {
      prev.forEach((p) => {
        if (p.kind === "file") URL.revokeObjectURL(p.url)
      })
      return []
    })
  }

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setPreviews((prev) => {
      const room = MAX_IMAGES - prev.length
      if (room <= 0) {
        toast.error("Maximum 6 images allowed per combo")
        return prev
      }
      const accepted = files.slice(0, room)
      if (files.length > room) {
        toast.error(`Only ${room} more image(s) allowed (max 6)`)
      }
      return [
        ...prev,
        ...accepted.map((file) => ({
          kind: "file" as const,
          file,
          url: URL.createObjectURL(file),
        })),
      ]
    })
    e.target.value = ""
  }

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const target = prev[index]
      if (target?.kind === "file") URL.revokeObjectURL(target.url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const normalItems = useMemo(
    () => items.filter((i) => (i.productType || "normal") === "normal"),
    [items]
  )
  const comboItems = useMemo(
    () => items.filter((i) => i.productType === "combo"),
    [items]
  )

  const selectedList = Object.values(picks)

  const estimatedOriginal = selectedList.reduce((sum, pick) => {
    const p = normalItems.find((i) => i._id === pick.id)
    if (!p) return sum
    let unit = p.price
    if (pick.variantLabel && p.hasVariants) {
      const v = p.variants?.find((x) => x.label === pick.variantLabel)
      if (v) unit = v.price
    }
    return sum + unit * pick.quantity
  }, 0)

  const toggleSelect = (item: MenuItem) => {
    setPicks((prev) => {
      if (prev[item._id]) {
        const next = { ...prev }
        delete next[item._id]
        return next
      }
      const defaultSize = item.hasVariants
        ? item.variants?.find((v) => v.isDefault)?.label ||
          item.variants?.[0]?.label ||
          null
        : null
      return {
        ...prev,
        [item._id]: {
          id: item._id,
          quantity: 1,
          variantLabel: defaultSize,
        },
      }
    })
  }

  const setPickSize = (id: string, label: string) => {
    setPicks((prev) => {
      if (!prev[id]) return prev
      return { ...prev, [id]: { ...prev[id], variantLabel: label } }
    })
  }

  const openReadyDialog = () => {
    if (selectedList.length < 2) {
      toast.error("Select at least 2 products")
      return
    }
    setEditingId(null)
    setForm({
      name: "",
      description: "",
      comboPrice: estimatedOriginal.toFixed(2),
    })
    clearPreviews()
    setDialogOpen(true)
  }

  const openEditDialog = (item: MenuItem) => {
    setEditingId(item._id)
    setForm({
      name: item.name,
      description: item.description,
      comboPrice: String(item.price),
    })
    const nextPicks: Record<string, ComboPick> = {}
    item.comboItems?.forEach((ci) => {
      const id =
        typeof ci.item === "object" && ci.item ? ci.item._id : String(ci.item)
      if (!id) return
      nextPicks[id] = {
        id,
        quantity: ci.quantity || 1,
        variantLabel: ci.variantLabel ?? null,
      }
    })
    setPicks(nextPicks)
    setComboMode(false)
    clearPreviews()
    setPreviews(
      getProductImages(item).map((url) => ({ kind: "existing" as const, url }))
    )
    setDialogOpen(true)
  }

  const handleSaveCombo = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.comboPrice) {
      toast.error("Please fill in all required fields")
      return
    }
    if (!previews.length) {
      toast.error("Please add at least one image")
      return
    }
    if (Object.keys(picks).length < 2 && !editingId) {
      toast.error("Select at least 2 products")
      return
    }
    try {
      const fd = new FormData()
      fd.append("name", form.name.trim())
      fd.append("description", form.description.trim())
      fd.append("comboPrice", form.comboPrice)
      fd.append(
        "comboItems",
        JSON.stringify(
          selectedList.map((p) => ({
            id: p.id,
            quantity: p.quantity,
            variantLabel: p.variantLabel,
          }))
        )
      )
      const existing = previews
        .filter(
          (p): p is Extract<PreviewItem, { kind: "existing" }> =>
            p.kind === "existing"
        )
        .map((p) => p.url)
      fd.append("existingImages", JSON.stringify(existing))
      previews.forEach((p) => {
        if (p.kind === "file") {
          fd.append("images", p.file, p.file.name)
        }
      })

      if (editingId) {
        await updateCombo.mutateAsync({ id: editingId, data: fd })
        toast.success("Combo updated")
      } else {
        if (!previews.some((p) => p.kind === "file")) {
          toast.error("Please upload at least one image")
          return
        }
        await createCombo.mutateAsync(fd)
        toast.success("Combo created")
      }
      setDialogOpen(false)
      setComboMode(false)
      setEditingId(null)
      setPicks({})
      clearPreviews()
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : editingId
            ? "Failed to update combo"
            : "Failed to create combo"
      toast.error(message)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteProduct.mutateAsync(deleteId)
      toast.success("Combo deleted")
      setDeleteId(null)
    } catch {
      toast.error("Failed to delete combo")
    }
  }

  const includesLabel = (item: MenuItem) => {
    if (!item.comboItems?.length) return "—"
    return item.comboItems
      .map((ci) => {
        const name =
          typeof ci.item === "object" && ci.item ? ci.item.name : "Item"
        const size = ci.variantLabel ? ` (${ci.variantLabel})` : ""
        return `${ci.quantity}× ${name}${size}`
      })
      .join(", ")
  }

  const saving = createCombo.isPending || updateCombo.isPending
  const isEditing = !!editingId
  const pickUnitPrice = (pick: ComboPick) => {
    const p = normalItems.find((i) => i._id === pick.id)
    if (!p) return 0
    if (pick.variantLabel && p.hasVariants) {
      return (
        p.variants?.find((v) => v.label === pick.variantLabel)?.price ?? p.price
      )
    }
    return p.price
  }

  return (
    <TooltipProvider>
      <div>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Combos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bundle products into combo packs — pick size when a product has
              sizes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="cursor-pointer"
              disabled={isFetching}
              onClick={() => refetch()}
            >
              {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Refresh
            </Button>
            <Button
              className="cursor-pointer"
              variant={comboMode ? "secondary" : "default"}
              onClick={() => {
                setComboMode((v) => !v)
                setPicks({})
              }}
            >
              <Layers className="mr-2 h-4 w-4" />
              {comboMode ? "Cancel Selection" : "Make Combo"}
            </Button>
          </div>
        </div>

        {comboMode && (
          <div className="mb-4 space-y-4">
            {selectedList.length >= 2 && (
              <div className="sticky top-0 z-10 flex flex-col gap-2 rounded-xl border bg-background p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium">
                  {selectedList.length} products · Estimate{" "}
                  {formatPrice(estimatedOriginal)}
                </span>
                <Button className="cursor-pointer" onClick={openReadyDialog}>
                  Ready for Combo
                </Button>
              </div>
            )}

            <Card className="overflow-hidden border shadow-sm">
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12" />
                      <TableHead>Image</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : (
                      normalItems.map((item) => {
                        const selected = !!picks[item._id]
                        return (
                          <TableRow
                            key={item._id}
                            className={cn(selected && "bg-primary/5")}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => toggleSelect(item)}
                                className="cursor-pointer"
                              />
                            </TableCell>
                            <TableCell>
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-12 w-12 rounded-lg bg-muted/40 object-contain"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.name}
                              {item.hasVariants && (
                                <Badge
                                  variant="secondary"
                                  className="ml-2 text-[10px]"
                                >
                                  Sizes
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[220px]">
                              <Tooltip>
                                <TooltipTrigger className="block max-w-[220px] cursor-default truncate text-left text-sm text-muted-foreground">
                                  {item.description || "—"}
                                </TooltipTrigger>
                                {!!item.description && (
                                  <TooltipContent className="max-w-xs">
                                    {item.description}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              {selected && item.hasVariants ? (
                                <select
                                  className="h-8 cursor-pointer rounded-md border bg-background px-2 text-xs"
                                  value={picks[item._id]?.variantLabel || ""}
                                  onChange={(e) =>
                                    setPickSize(item._id, e.target.value)
                                  }
                                >
                                  {item.variants?.map((v) => (
                                    <option key={v.label} value={v.label}>
                                      {v.label} ({formatPrice(v.price)})
                                    </option>
                                  ))}
                                </select>
                              ) : item.hasVariants ? (
                                <span className="text-xs text-muted-foreground">
                                  Select to choose size
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{formatPrice(item.price)}</TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {!comboMode && (
          <Card className="overflow-hidden border shadow-sm">
            <CardContent className="overflow-x-auto p-0">
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : comboItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <Layers className="mx-auto mb-2 h-10 w-10 opacity-30" />
                        <p className="font-medium">No combos yet</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {comboItems.map((item, i) => (
                        <motion.tr
                          key={item._id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.25,
                            delay: Math.min(i * 0.04, 0.2),
                          }}
                          className="border-b"
                        >
                          <TableCell>
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-14 w-14 rounded-lg bg-muted/40 object-contain"
                            />
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold">{item.name}</p>
                            <Badge className="mt-1" variant="secondary">
                              Combo
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden max-w-[240px] md:table-cell">
                            <Tooltip>
                              <TooltipTrigger className="line-clamp-2 max-w-[240px] cursor-default text-left text-sm text-muted-foreground">
                                {item.description || "—"}
                              </TooltipTrigger>
                              {!!item.description && (
                                <TooltipContent className="max-w-xs">
                                  {item.description}
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            <Tooltip>
                              <TooltipTrigger className="line-clamp-2 max-w-[220px] cursor-default text-left text-sm text-muted-foreground">
                                {includesLabel(item)}
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                {includesLabel(item)}
                              </TooltipContent>
                            </Tooltip>
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
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="cursor-pointer"
                              onClick={() => openEditDialog(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="cursor-pointer text-destructive"
                              onClick={() => setDeleteId(item._id)}
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
        )}

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              clearPreviews()
              setEditingId(null)
            }
          }}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader className="rounded-t-lg border-b bg-primary/5 -mx-1 px-1 pb-4">
              <DialogTitle className="text-xl">
                {isEditing ? "Update Combo Pack" : "Create Combo Pack"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update name, price, included items, and images."
                  : "Name your pack, set the combo price, and add up to 6 images."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="mb-2 text-sm font-medium">Selected items</p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {selectedList.map((pick) => {
                    const p = normalItems.find((i) => i._id === pick.id)
                    return (
                      <li
                        key={pick.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="min-w-0 truncate">
                          {p?.name}
                          {pick.variantLabel ? ` (${pick.variantLabel})` : ""}
                        </span>
                        <span className="shrink-0 font-medium text-foreground">
                          {formatPrice(pickUnitPrice(pick))}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t pt-2 text-xs">
                  <span className="text-muted-foreground">Original total</span>
                  <span className="font-semibold">
                    {formatPrice(estimatedOriginal)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="combo-name">
                  Combo Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="combo-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-11"
                  placeholder="e.g. Morning Starter Pack"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="combo-desc">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="combo-desc"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className="resize-none"
                  placeholder="Short description for customers"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="combo-price">
                  Combo Price ($) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="combo-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.comboPrice}
                  onChange={(e) =>
                    setForm({ ...form, comboPrice: e.target.value })
                  }
                  className="h-11"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Suggested from selected items — adjust for a combo discount if
                  you like.
                </p>
              </div>

              <div className="space-y-2">
                <Label>
                  Combo Images <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Up to 6 images. Customers swipe or tap the dots under the
                  photo on the menu card.
                </p>
                <div className="flex flex-wrap gap-3">
                  {previews.map((p, index) => (
                    <div
                      key={`${p.url}-${index}`}
                      className="relative rounded-lg border-2 border-dashed p-1"
                    >
                      <img
                        src={p.url}
                        alt={`Combo preview ${index + 1}`}
                        className="h-24 w-24 rounded-md bg-muted/40 object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 cursor-pointer rounded-full"
                        onClick={() => removePreview(index)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {previews.length < MAX_IMAGES && (
                    <button
                      type="button"
                      className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-muted/40"
                      onClick={() =>
                        document.getElementById("combo-images")?.click()
                      }
                    >
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                      <span className="mt-1 text-[10px] text-muted-foreground">
                        Add
                      </span>
                    </button>
                  )}
                </div>
                <Input
                  id="combo-images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImagesChange}
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    disabled={previews.length >= MAX_IMAGES}
                    onClick={() =>
                      document.getElementById("combo-images")?.click()
                    }
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose images
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {previews.length}/{MAX_IMAGES} images
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 border-t pt-4 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 cursor-pointer sm:flex-none sm:min-w-[120px]"
                disabled={saving}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-11 flex-1 cursor-pointer sm:flex-none sm:min-w-[140px]"
                onClick={handleSaveCombo}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Update Combo"
                ) : (
                  "Create Combo"
                )}
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
    </TooltipProvider>
  )
}

export default Combos
