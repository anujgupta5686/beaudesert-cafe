export type ProductVariant = {
  label: string
  price: number
  isDefault?: boolean
}

export type Category = {
  _id: string
  name: string
  slug: string
  description?: string
  isActive?: boolean
  sortOrder?: number
}

export type ComboItemRef = {
  item: MenuItem | string
  quantity: number
  variantLabel?: string | null
}

export type MenuItem = {
  _id: string
  name: string
  description: string
  price: number
  image: string
  images?: string[]
  category?: Category | string | null
  productType?: "normal" | "combo"
  hasVariants?: boolean
  variants?: ProductVariant[]
  comboItems?: ComboItemRef[]
  originalPrice?: number
  isActive?: boolean
  isAvailable?: boolean
  createdAt?: string
  updatedAt?: string
}

/** Cart line — unique by menu id + selected size */
export type CartItem = {
  _id: string
  cartKey: string
  name: string
  description: string
  price: number
  image: string
  quantity: number
  size?: string | null
  productType?: "normal" | "combo"
  originalPrice?: number
  hasVariants?: boolean
  variants?: ProductVariant[]
}

export type OrderItem = {
  menuItemId: string
  name: string
  price: number
  quantity: number
  image?: string
  size?: string | null
  productType?: "normal" | "combo"
}

export type OrderLocation = {
  lat?: number | null
  lng?: number | null
}

export type Order = {
  _id: string
  orderNumber?: string
  customerName: string
  email?: string
  mobile: string
  address: string
  location?: OrderLocation | null
  specialInstructions: string
  items: OrderItem[]
  totalAmount: number
  status?: string
  feedbackStatus?: "none" | "pending" | "submitted"
  createdAt: string
  updatedAt: string
}

export type CafeSettings = {
  _id?: string
  name: string
  tagline?: string
  address: string
  phone: string
  email: string
  workingHours?: string
  mapEmbedUrl?: string
  isTemporarilyClosed?: boolean
  closedFrom?: string | null
  closedTo?: string | null
  closureMessage?: string
}

export type ContactMessage = {
  _id: string
  name: string
  email: string
  message: string
  isRead: boolean
  createdAt: string
}

export type Admin = {
  id: string
  email: string
  name: string
}

export type ApiResponse<T = unknown> = {
  success: boolean
  message?: string
  data: T
}

export type FeedbackPayload = {
  overallRating: number
  overallComment?: string
  itemRatings?: {
    menuItemId?: string
    name: string
    rating: number
    comment?: string
  }[]
}
