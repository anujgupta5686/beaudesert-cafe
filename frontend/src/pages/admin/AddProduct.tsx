import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { createMenuItem, updateMenuItem } from "@/store/slices/menuSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload, X, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

const AddProduct = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((state) => state.menu)
  const isEdit = !!id

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: null as File | null,
  })
  const [preview, setPreview] = useState("")

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
      }
    }
  }, [isEdit, id, items])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
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
    // Reset the file input
    const fileInput = document.getElementById("image") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    if (!formData.name || !formData.description || !formData.price) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!formData.image && !isEdit) {
      toast.error("Please select an image")
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append("name", formData.name)
    formDataToSend.append("description", formData.description)
    formDataToSend.append("price", formData.price)
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
    } catch (error) {
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
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Update the product details below"
              : "Fill in the details to add a new product"}
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={handleChange}
                className="h-11"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your product..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="resize-none"
                required
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium">
                Price (₹) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price}
                onChange={handleChange}
                className="h-11"
                required
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Product Image{" "}
                {!isEdit && <span className="text-destructive">*</span>}
              </Label>

              {/* Image Preview */}
              {preview ? (
                <div className="relative inline-block rounded-lg border-2 border-dashed border-muted-foreground/20 p-2">
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
                  className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 transition-colors hover:border-primary/50 hover:bg-muted/50"
                  onClick={() => document.getElementById("image")?.click()}
                >
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    PNG, JPG, WEBP (Max 5MB)
                  </p>
                </div>
              )}

              <Input
                id="image"
                name="image"
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
                  className="mt-2"
                  onClick={() => document.getElementById("image")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Image
                </Button>
              )}
            </div>

            {/* Action Buttons */}
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
