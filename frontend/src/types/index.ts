// Menu Item Type
export type MenuItem = {
  _id: string
  name: string
  description: string
  price: number
  image: string
  createdAt?: string
  updatedAt?: string
}

// Cart Item Type
export type CartItem = MenuItem & {
  quantity: number
}

// Order Item Type
export type OrderItem = {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

// Order Type
export type Order = {
  _id: string
  customerName: string
  mobile: string
  address: string
  specialInstructions: string
  items: OrderItem[]
  totalAmount: number
  status?: string // ← ADD THIS
  createdAt: string
  updatedAt: string
}

// Admin Type
export type Admin = {
  id: string
  email: string
  name: string
}

// API Response Type
export type ApiResponse<T = any> = {
  success: boolean
  message?: string
  data: T
}
