import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  useDeleteProductMutation,
  useMenuQuery,
  useUpdateProductMutation,
} from "@/hooks/useMenuQueries"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { formatPrice } from "@/lib/formatPrice"
import { Loader2, Plus, Search, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { MenuItem } from "@/types"
import { getProductImages } from "@/lib/productImages"

const Products = () => {
  const navigate = useNavigate()
  const { data: items = [], isLoading, isError, refetch, isFetching } =
    useMenuQuery({ includeUnavailable: true })
  const updateProduct = useUpdateProductMutation()
  const deleteProduct = useDeleteProductMutation()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"normal" | "combo">("normal")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const filteredItems = items.filter((item) => {
    const type = item.productType || "normal"
    const matchesType = type === activeTab
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteProduct.mutateAsync(deleteId)
      toast.success("Product deleted successfully")
      setDeleteId(null)
    } catch {
      toast.error("Failed to delete product")
    }
  }

  const toggleAvailability = async (item: MenuItem) => {
    const next = item.isAvailable === false
    try {
      setTogglingId(item._id)
      const fd = new FormData()
      fd.append("name", item.name)
      fd.append("description", item.description)
      fd.append("price", String(item.price))
      fd.append("isAvailable", String(next))
      if (typeof item.category === "object" && item.category) {
        fd.append("categoryId", item.category._id)
      } else if (typeof item.category === "string" && item.category) {
        fd.append("categoryId", item.category)
      }
      if (item.hasVariants) {
        fd.append("hasVariants", "true")
        fd.append("variants", JSON.stringify(item.variants || []))
      }
      await updateProduct.mutateAsync({ id: item._id, data: fd })
      toast.success(next ? "Marked available" : "Marked sold out")
    } catch {
      toast.error("Failed to update availability")
    } finally {
      setTogglingId(null)
    }
  }

  const categoryName = (item: MenuItem) => {
    if (typeof item.category === "object" && item.category) {
      return item.category.name
    }
    return "—"
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
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
            onClick={() => navigate("/admin/products/add")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <Button
          size="sm"
          className="cursor-pointer"
          variant={activeTab === "normal" ? "default" : "outline"}
          onClick={() => setActiveTab("normal")}
        >
          Normal
        </Button>
        <Button
          size="sm"
          className="cursor-pointer"
          variant={activeTab === "combo" ? "default" : "outline"}
          onClick={() => setActiveTab("combo")}
        >
          Combo
        </Button>
      </div>

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isError && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          Failed to load products.{" "}
          <button
            type="button"
            className="cursor-pointer font-medium underline"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Images</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const available = item.isAvailable !== false
                return (
                  <TableRow
                    key={item._id}
                    className={cn(!available && "opacity-60")}
                  >
                    <TableCell>
                      <div className="scrollbar-thin-theme flex max-w-[140px] items-center gap-1 overflow-x-auto pb-0.5">
                        {getProductImages(item).map((src, i) => (
                          <img
                            key={`${item._id}-${i}`}
                            src={src}
                            alt={`${item.name} ${i + 1}`}
                            className="h-8 w-8 shrink-0 rounded-md border border-border bg-muted/40 object-contain"
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.name}
                      {item.hasVariants && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          Sizes
                        </Badge>
                      )}
                      {!available && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          Sold out
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{categoryName(item)}</TableCell>
                    <TableCell>{formatPrice(item.price)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={available}
                        disabled={togglingId === item._id}
                        onCheckedChange={() => toggleAvailability(item)}
                        className="cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {activeTab === "normal" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer"
                          onClick={() =>
                            navigate(`/admin/products/edit/${item._id}`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(item._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Products
