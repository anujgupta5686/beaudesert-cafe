import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  useCategoriesQuery,
  useCreateProductMutation,
  useMenuQuery,
  useUpdateProductMutation,
} from "@/hooks/useMenuQueries"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { SearchableSelect } from "@/components/shared/SearchableSelect"
import {
  ArrowLeft,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import type { ProductVariant } from "@/types"
import { getProductImages } from "@/lib/productImages"

const defaultVariants: ProductVariant[] = [
  { label: "Small", price: 0, isDefault: false },
  { label: "Medium", price: 0, isDefault: true },
  { label: "Large", price: 0, isDefault: false },
]

type PreviewItem =
  | { kind: "existing"; url: string }
  | { kind: "file"; file: File; url: string }

const AddProduct = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { data: items = [] } = useMenuQuery({ includeUnavailable: true })
  const { data: categories = [] } = useCategoriesQuery(true)
  const createProduct = useCreateProductMutation()
  const updateProduct = useUpdateProductMutation()
  const saving = createProduct.isPending || updateProduct.isPending

  const [categoryId, setCategoryId] = useState("")
  const [hasVariants, setHasVariants] = useState(false)
  const [isAvailable, setIsAvailable] = useState(true)
  const [variants, setVariants] = useState<ProductVariant[]>(defaultVariants)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
  })
  const [previews, setPreviews] = useState<PreviewItem[]>([])

  useEffect(() => {
    if (!isEdit || !id) return
    const item = items.find((item) => item._id === id)
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
      })
      setPreviews(
        getProductImages(item).map((url) => ({ kind: "existing", url }))
      )
      setHasVariants(!!item.hasVariants)
      setIsAvailable(item.isAvailable !== false)
      if (item.hasVariants && item.variants?.length) {
        setVariants(item.variants)
      }
      if (typeof item.category === "object" && item.category) {
        setCategoryId(item.category._id)
      } else if (typeof item.category === "string") {
        setCategoryId(item.category)
      }
    }
  }, [isEdit, id, items])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const MAX_IMAGES = 6

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setPreviews((prev) => {
      const room = MAX_IMAGES - prev.length
      if (room <= 0) {
        toast.error("Maximum 6 images allowed per product")
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

  const updateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: string | number | boolean
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i !== index) {
          if (field === "isDefault" && value === true) {
            return { ...v, isDefault: false }
          }
          return v
        }
        return { ...v, [field]: value }
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.description || !formData.price) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!previews.length) {
      toast.error("Please add at least one image")
      return
    }
    if (previews.length > MAX_IMAGES) {
      toast.error("Maximum 6 images allowed per product")
      return
    }

    if (hasVariants) {
      const invalid = variants.some((v) => !v.label || v.price < 0)
      if (invalid) {
        toast.error("Please set valid size labels and prices")
        return
      }
    }

    const formDataToSend = new FormData()
    formDataToSend.append("name", formData.name)
    formDataToSend.append("description", formData.description)
    formDataToSend.append("price", formData.price)
    if (categoryId) formDataToSend.append("categoryId", categoryId)
    formDataToSend.append("hasVariants", String(hasVariants))
    formDataToSend.append("isAvailable", String(isAvailable))
    if (hasVariants) {
      formDataToSend.append("variants", JSON.stringify(variants))
    }

    const existing = previews
      .filter((p): p is Extract<PreviewItem, { kind: "existing" }> => p.kind === "existing")
      .map((p) => p.url)
    formDataToSend.append("existingImages", JSON.stringify(existing))

    // Same field name repeatedly — express-fileupload merges into an array
    previews.forEach((p) => {
      if (p.kind === "file") {
        formDataToSend.append("images", p.file, p.file.name)
      }
    })

    if (!isEdit && !previews.some((p) => p.kind === "file")) {
      toast.error("Please upload at least one image")
      return
    }
    if (isEdit && !existing.length && !previews.some((p) => p.kind === "file")) {
      toast.error("Please keep or upload at least one image")
      return
    }

    try {
      if (isEdit) {
        await updateProduct.mutateAsync({ id: id!, data: formDataToSend })
        toast.success("Product updated successfully")
      } else {
        await createProduct.mutateAsync(formDataToSend)
        toast.success("Product created successfully")
      }
      navigate("/admin/products")
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : "Failed to save product"
      toast.error(message)
    }
  }

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => navigate("/admin/products")}
        className="mb-6 cursor-pointer"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>

      <Card className="mx-auto max-w-2xl border-0 shadow-sm">
        <CardHeader className="rounded-t-lg border-b bg-primary/5">
          <CardTitle className="text-2xl">
            {isEdit ? "Edit Product" : "Add New Product"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="resize-none"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <SearchableSelect
                id="category"
                value={categoryId || undefined}
                onValueChange={setCategoryId}
                placeholder="Select category"
                searchPlaceholder="Search to Select"
                emptyText="No categories match"
                options={categories.map((cat) => ({
                  value: cat._id,
                  label: cat.name,
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">
                Base Price ($) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                className="h-11"
                required
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Available for ordering</p>
                <p className="text-xs text-muted-foreground">
                  Turn off when sold out
                </p>
              </div>
              <Switch
                checked={isAvailable}
                onCheckedChange={setIsAvailable}
                className="cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Size options</p>
                <p className="text-xs text-muted-foreground">
                  Enable Small / Medium / Large with separate prices
                </p>
              </div>
              <Switch
                checked={hasVariants}
                onCheckedChange={setHasVariants}
                className="cursor-pointer"
              />
            </div>

            {hasVariants && (
              <div className="space-y-3 rounded-lg border p-3">
                {variants.map((v, index) => (
                  <div
                    key={v.label + index}
                    className="grid grid-cols-3 items-end gap-2"
                  >
                    <div className="space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={v.label}
                        onChange={(e) =>
                          updateVariant(index, "label", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={v.price}
                        onChange={(e) =>
                          updateVariant(index, "price", Number(e.target.value))
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="cursor-pointer"
                      variant={v.isDefault ? "default" : "outline"}
                      onClick={() => updateVariant(index, "isDefault", true)}
                    >
                      {v.isDefault ? "Default" : "Set default"}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>
                Product Images <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Up to 6 images. Customers swipe or tap the dots under the photo
                on the menu card.
              </p>
              <div className="flex flex-wrap gap-3">
                {previews.map((p, index) => (
                  <div
                    key={`${p.url}-${index}`}
                    className="relative rounded-lg border-2 border-dashed p-1"
                  >
                    <img
                      src={p.url}
                      alt={`Preview ${index + 1}`}
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
                    onClick={() => document.getElementById("images")?.click()}
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    <span className="mt-1 text-[10px] text-muted-foreground">
                      Add
                    </span>
                  </button>
                )}
              </div>
              <Input
                id="images"
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
                  onClick={() => document.getElementById("images")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose images
                </Button>
                <span className="text-xs text-muted-foreground">
                  {previews.length}/{MAX_IMAGES} images
                </span>
              </div>
            </div>

            <div className="flex gap-4 border-t pt-4">
              <Button
                type="submit"
                className="h-11 flex-1 cursor-pointer"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  "Update Product"
                ) : (
                  "Create Product"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 cursor-pointer"
                disabled={saving}
                onClick={() => navigate("/admin/products")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AddProduct
