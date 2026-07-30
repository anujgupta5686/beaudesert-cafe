import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { createMenuItem, updateMenuItem, fetchMenu } from "@/store/slices/menuSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import axios from "@/api/axios"
import type { Category, ProductVariant } from "@/types"

const defaultVariants: ProductVariant[] = [
  { label: "Small", price: 0, isDefault: false },
  { label: "Medium", price: 0, isDefault: true },
  { label: "Large", price: 0, isDefault: false },
]

const AddProduct = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((state) => state.menu)
  const isEdit = !!id

  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState("")
  const [hasVariants, setHasVariants] = useState(false)
  const [isAvailable, setIsAvailable] = useState(true)
  const [variants, setVariants] = useState<ProductVariant[]>(defaultVariants)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: null as File | null,
  })
  const [preview, setPreview] = useState("")

  useEffect(() => {
    axios
      .get("/categories?all=true")
      .then((res) => setCategories(res.data.data || []))
      .catch(() => {})
    if (isEdit) {
      dispatch(fetchMenu({ includeUnavailable: true }))
    }
  }, [dispatch, isEdit])

  useEffect(() => {
    if (isEdit) {
      const item = items.find((item) => item._id === id)
      if (item) {
        setFormData({
          name: item.name,
          description: item.description,
          price: item.price.toString(),
          image: null,
        })
        setPreview(item.image)
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
    }
  }, [isEdit, id, items])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, image: file })
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: null })
    setPreview("")
    const fileInput = document.getElementById("image") as HTMLInputElement
    if (fileInput) fileInput.value = ""
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

    if (!formData.image && !isEdit) {
      toast.error("Please select an image")
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
    if (formData.image) {
      formDataToSend.append("image", formData.image)
    }

    try {
      if (isEdit) {
        await dispatch(updateMenuItem({ id: id!, data: formDataToSend }))
        toast.success("Product updated successfully")
      } else {
        await dispatch(createMenuItem(formDataToSend))
        toast.success("Product created successfully")
      }
      navigate("/admin/products")
    } catch {
      toast.error("Failed to save product")
    }
  }

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => navigate("/admin/products")}
        className="mb-6"
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
              <select
                id="category"
                className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
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
                  Turn off when sold out — hidden / faded on the customer menu
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
                    className="grid grid-cols-3 gap-2 items-end"
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
                          updateVariant(
                            index,
                            "price",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
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
                Product Image{" "}
                {!isEdit && <span className="text-destructive">*</span>}
              </Label>
              {preview ? (
                <div className="relative inline-block rounded-lg border-2 border-dashed p-2">
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-40 w-40 rounded-md object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed"
                  onClick={() => document.getElementById("image")?.click()}
                >
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Click to upload
                  </p>
                </div>
              )}
              <Input
                id="image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              {!preview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("image")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Image
                </Button>
              )}
            </div>

            <div className="flex gap-4 border-t pt-4">
              <Button type="submit" className="h-11 flex-1" disabled={loading}>
                {loading
                  ? "Saving..."
                  : isEdit
                    ? "Update Product"
                    : "Create Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1"
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
