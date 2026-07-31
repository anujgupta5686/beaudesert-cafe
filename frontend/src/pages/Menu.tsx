import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMenuQuery, useCategoriesQuery } from "@/hooks/useMenuQueries"
import { useCart } from "@/hooks/useCart"
import { useCartQuantity } from "@/hooks/useCartQuantity"
import MenuCard from "@/components/shared/MenuCard"
import { ProductDetailDialog } from "@/components/shared/ProductDetailDialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import type { MenuItem } from "@/types"

const Menu = () => {
  const { data: items = [], isLoading, isError, refetch, isFetching } =
    useMenuQuery()
  const { data: categories = [] } = useCategoriesQuery(false)
  const { addItem, updateQuantity } = useCart()
  const { getQuantity } = useCartQuantity()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false
      if (activeCategory === "all") return true
      if (activeCategory === "combo") return item.productType === "combo"

      const cat =
        typeof item.category === "object" && item.category
          ? item.category.slug
          : null
      return cat === activeCategory
    })
  }, [items, searchTerm, activeCategory])

  const filters = [
    { key: "all", label: "All" },
    ...categories.map((c) => ({ key: c.slug, label: c.name })),
    { key: "combo", label: "Combos" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 py-10 md:py-14">
      <div className="container mx-auto px-4">
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
            Our Menu
          </h1>
          <p className="text-sm text-muted-foreground">
            Filter by category or search your favorites
          </p>
        </motion.div>

        <div className="mx-auto mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-xl border-muted-foreground/20 pl-10 shadow-sm"
            />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.key}
              size="sm"
              variant={activeCategory === filter.key ? "default" : "outline"}
              className="h-9 cursor-pointer rounded-full px-4"
              onClick={() => setActiveCategory(filter.key)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {isError ? (
          <div className="rounded-2xl border border-dashed py-16 text-center">
            <p className="mb-3 text-sm text-muted-foreground">
              Could not load menu. Check your connection.
            </p>
            <Button
              className="cursor-pointer"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">
            {searchTerm
              ? "No items match your search"
              : "No items available yet."}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredItems.map((item, i) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <MenuCard
                    item={item}
                    onAddToCart={addItem}
                    getQuantity={getQuantity}
                    onUpdateQuantity={updateQuantity}
                    onClick={() => {
                      setSelectedItem(item)
                      setDialogOpen(true)
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <ProductDetailDialog
        item={selectedItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        getQuantity={getQuantity}
        onAdd={addItem}
        onUpdateQuantity={updateQuantity}
      />
    </div>
  )
}

export default Menu
