import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useMenuQuery } from "@/hooks/useMenuQueries"
import {
  Coffee,
  ChefHat,
  Clock,
  ArrowRight,
  Star,
  UtensilsCrossed,
  ShoppingBag,
  MapPin,
  Heart,
  Search,
  CheckCircle2,
} from "lucide-react"
import { useCart } from "@/hooks/useCart"
import { useCartQuantity } from "@/hooks/useCartQuantity"
import MenuCard from "@/components/shared/MenuCard"
import { ProductDetailDialog } from "@/components/shared/ProductDetailDialog"
import type { MenuItem } from "@/types"

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
}

const features = [
  {
    icon: Coffee,
    title: "Premium Coffee",
    description: "Sourced from the finest beans",
  },
  {
    icon: ChefHat,
    title: "Expert Chefs",
    description: "Culinary craftsmanship daily",
  },
  {
    icon: Clock,
    title: "Quick Service",
    description: "Freshly prepared with care",
  },
]

const Home = () => {
  const navigate = useNavigate()
  const { data: items = [], isLoading: loading } = useMenuQuery()
  const { addItem, updateQuantity } = useCart()
  const { getQuantity } = useCartQuantity()
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const featuredItems = items.slice(0, 8)

  const openProductDialog = (item: MenuItem) => {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-background to-background py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary)/12%,transparent_55%)]" />
        <div className="container relative mx-auto px-4">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <motion.div
              className="space-y-6"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Star className="h-3.5 w-3.5 fill-primary" />
                Premium cafe & restaurant
              </div>
              <h1 className="text-4xl leading-[1.1] font-bold tracking-tight md:text-5xl lg:text-6xl">
                Beaudesert
                <span className="mt-1 block text-primary">Cafe & Restaurant</span>
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                Coffee, comfort food, and combos — crafted fresh and ready to
                order online in minutes.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="h-11 px-6" onClick={() => navigate("/menu")}>
                  Explore Menu
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 px-6"
                  onClick={() => navigate("/contact")}
                >
                  Visit Us
                </Button>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.15 }}
            >
              <div className="grid grid-cols-2 gap-3">
                <img
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=400&fit=crop"
                  alt="Fresh coffee"
                  className="h-48 w-full rounded-2xl object-cover shadow-lg md:h-60"
                />
                <img
                  src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&h=400&fit=crop"
                  alt="Cafe atmosphere"
                  className="mt-8 h-48 w-full rounded-2xl object-cover shadow-lg md:mt-10 md:h-60"
                />
              </div>
              <motion.div
                className="absolute -bottom-3 -left-2 rounded-xl border bg-background/95 px-3 py-2 shadow-lg backdrop-blur md:-left-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold">
                    Fresh · Fast · Local
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
              >
                <Card className="h-full border bg-card/80 shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold">{feature.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About the cafe — hero-matched composition */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--color-primary)/10%,transparent_50%)]" />
        <div className="container relative mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <motion.div
              className="relative order-2 lg:order-1"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55 }}
            >
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="overflow-hidden rounded-3xl shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900&h=700&fit=crop"
                    alt="Cafe interior"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
                <motion.img
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop"
                  alt="Coffee pour"
                  className="absolute -right-3 -bottom-6 h-28 w-28 rounded-2xl object-cover shadow-lg ring-4 ring-background sm:-right-6 sm:h-36 sm:w-36 md:h-40 md:w-40"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.45 }}
                />
                <motion.div
                  className="absolute -top-3 left-3 rounded-xl bg-background/95 px-3 py-2 shadow-lg backdrop-blur sm:left-5"
                  initial={{ opacity: 0, y: -8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold">Est. Beaudesert</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              className="order-1 space-y-6 lg:order-2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Heart className="h-3.5 w-3.5 fill-primary" />
                Our cafe
              </div>
              <h2 className="text-3xl leading-tight font-bold tracking-tight md:text-4xl lg:text-[2.75rem]">
                A neighbourhood spot for
                <span className="mt-1 block text-primary">
                  coffee, meals &amp; company
                </span>
              </h2>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                Beaudesert Cafe serves freshly brewed coffee, seasonal plates,
                sweets, and value combos. Order online for pickup or delivery —
                or pull up a chair and enjoy the atmosphere with us.
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {[
                  {
                    icon: Heart,
                    label: "Made fresh",
                    detail: "Daily favourites",
                  },
                  {
                    icon: ShoppingBag,
                    label: "Order online",
                    detail: "Clear USD prices",
                  },
                  {
                    icon: MapPin,
                    label: "Easy to find",
                    detail: "Hours & map",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    custom={i}
                    variants={fadeUp}
                    className="min-w-0 space-y-1.5 rounded-xl border border-border/60 bg-muted/20 p-2.5 sm:border-0 sm:bg-transparent sm:p-0"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 sm:h-9 sm:w-9">
                      <item.icon className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                    </span>
                    <p className="text-xs font-semibold sm:text-sm">
                      {item.label}
                    </p>
                    <p className="text-[10px] leading-snug text-muted-foreground sm:text-xs">
                      {item.detail}
                    </p>
                  </motion.div>
                ))}
              </div>
              <Button
                size="lg"
                className="h-11 cursor-pointer px-6"
                variant="outline"
                onClick={() => navigate("/contact")}
              >
                Get directions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How ordering works — connected flow, no boxed cards */}
      <section className="relative overflow-hidden border-y bg-gradient-to-b from-muted/40 via-background to-background py-16 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-primary)/8%,transparent_45%)]" />
        <div className="container relative mx-auto px-4">
          <motion.div
            className="mx-auto mb-12 max-w-xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <UtensilsCrossed className="h-3.5 w-3.5" />
              Simple ordering
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Order in three steps
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              From menu to your table — fast and straightforward
            </p>
          </motion.div>

          <div className="relative mx-auto max-w-5xl">
            <div className="pointer-events-none absolute top-10 right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" />
            <div className="grid gap-10 md:grid-cols-3 md:gap-8">
              {[
                {
                  step: "01",
                  icon: Search,
                  title: "Browse the menu",
                  text: "Pick coffee, food, desserts, or combo packs.",
                },
                {
                  step: "02",
                  icon: ShoppingBag,
                  title: "Add to cart",
                  text: "Choose sizes where needed and review your order.",
                },
                {
                  step: "03",
                  icon: CheckCircle2,
                  title: "Checkout",
                  text: "Share delivery details — we confirm by email.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-primary/10" />
                    <span className="absolute inset-2 rounded-full border border-primary/20 bg-background shadow-sm" />
                    <item.icon className="relative h-7 w-7 text-primary" />
                    <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {item.step.replace("0", "")}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured menu */}
      <section className="bg-muted/30 py-14">
        <div className="container mx-auto px-4">
          <motion.div
            className="mb-10 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Featured Menu
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Popular picks from our Restaurant
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : featuredItems.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No items available yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {featuredItems.map((item, i) => (
                  <motion.div
                    key={item._id}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-20px" }}
                    variants={fadeUp}
                  >
                    <MenuCard
                      item={item}
                      onAddToCart={addItem}
                      getQuantity={getQuantity}
                      onUpdateQuantity={updateQuantity}
                      onClick={() => openProductDialog(item)}
                    />
                  </motion.div>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Button
              variant="outline"
              className="h-10 cursor-pointer px-6"
              onClick={() => navigate("/menu")}
            >
              View Full Menu
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Visit CTA — full-bleed band, no boxed border vs footer */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-20 md:pb-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-primary/[0.07] to-primary/10" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[min(90vw,640px)] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="container relative mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mx-auto max-w-2xl text-center"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/80 px-3 py-1.5 text-xs font-medium text-primary shadow-sm backdrop-blur">
              <MapPin className="h-3.5 w-3.5" />
              Visit &amp; contact
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Come say hello
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              Questions, catering, or just want our hours and map? We&apos;re
              happy to help — send a message anytime.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="h-11 cursor-pointer px-7"
                onClick={() => navigate("/contact")}
              >
                Contact us
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 cursor-pointer border-primary/25 bg-background/60 px-7 backdrop-blur"
                onClick={() => navigate("/menu")}
              >
                Order now
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

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

export default Home
