import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Coffee, ChefHat, Clock, ArrowRight, Star } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchMenu } from "@/store/slices/menuSlice"
import { useCart } from "@/hooks/useCart"
import MenuCard from "@/components/shared/MenuCard"

const Home = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((state) => state.menu)
  const { addItem } = useCart()

  useEffect(() => {
    dispatch(fetchMenu())
  }, [dispatch])

  const featuredItems = items.slice(0, 4)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/20 via-primary/5 to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                <Star className="h-3 w-3 fill-primary" />
                <span>Premium Quality Coffee</span>
              </div>
              <h1 className="text-3xl leading-tight font-bold md:text-4xl lg:text-5xl">
                Welcome to <span className="text-primary">Beaudesert</span>
                <br />
                Cafe & Restaurant
              </h1>
              <p className="max-w-lg text-sm text-muted-foreground md:text-base">
                Where every cup tells a story. Experience the finest coffee and
                delicious food in a warm, welcoming atmosphere.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate("/menu")}>
                  View Menu
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate("/menu")}>
                  Order Now
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-3">
                <img
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop"
                  alt="Coffee"
                  className="h-48 w-full rounded-lg object-cover shadow-lg md:h-56"
                />
                <img
                  src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop"
                  alt="Coffee"
                  className="mt-6 h-48 w-full rounded-lg object-cover shadow-lg md:mt-8 md:h-56"
                />
              </div>
              <div className="absolute -bottom-3 -left-3 rounded-lg border bg-background px-3 py-2 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-6 w-6 rounded-full border-2 border-background bg-primary/20"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium">
                    500+ happy customers
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Coffee className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">Premium Coffee</h3>
                <p className="text-xs text-muted-foreground">
                  Sourced from the finest beans
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <ChefHat className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">Expert Chefs</h3>
                <p className="text-xs text-muted-foreground">
                  Culinary masterpieces daily
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">Quick Service</h3>
                <p className="text-xs text-muted-foreground">
                  Freshly prepared with love
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Menu Section */}
      <section className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold md:text-3xl">Featured Menu</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Discover our most popular items
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                <span className="text-xs text-muted-foreground">
                  Loading...
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {featuredItems.map((item) => (
                  <MenuCard key={item._id} item={item} onAddToCart={addItem} />
                ))}
              </div>
              {featuredItems.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No items available yet.
                  </p>
                </div>
              )}
              {items.length > 4 && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/menu")}
                  >
                    View Full Menu
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home
