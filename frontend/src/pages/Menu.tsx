import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchMenu } from "@/store/slices/menuSlice"
import { useCart } from "@/hooks/useCart"
import MenuCard from "@/components/shared/MenuCard"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const Menu = () => {
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((state) => state.menu)
  const { addItem } = useCart()
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    dispatch(fetchMenu())
  }, [dispatch])

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">Our Menu</h1>
          <p className="text-sm text-muted-foreground">
            Handcrafted with love, served with a smile
          </p>
        </div>

        {/* Search Bar */}
        <div className="mx-auto mb-8 max-w-xs">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>
        </div>

        {/* Menu Grid */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchTerm
                    ? "No items match your search"
                    : "No items available yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {filteredItems.map((item) => (
                  <MenuCard key={item._id} item={item} onAddToCart={addItem} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Menu
