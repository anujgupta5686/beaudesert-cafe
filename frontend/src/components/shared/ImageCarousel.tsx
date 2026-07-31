import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react"
import { Coffee } from "lucide-react"
import { cn } from "@/lib/utils"
import { getProductImages } from "@/lib/productImages"
import type { MenuItem } from "@/types"

interface ImageCarouselProps {
  item: Pick<MenuItem, "image" | "images" | "name">
  className?: string
  imgClassName?: string
}

/**
 * Product image gallery — swipe + clickable dots under the image.
 * Dots only render when the product has more than one image.
 */
export function ImageCarousel({
  item,
  className,
  imgClassName,
}: ImageCarouselProps) {
  const images = useMemo(() => getProductImages(item), [item])
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState<Record<number, boolean>>({})
  const touchStartX = useRef<number | null>(null)
  const multi = images.length > 1
  const galleryKey = images.join("|")

  useEffect(() => {
    setIndex(0)
    setFailed({})
  }, [galleryKey])

  const go = (next: number, e?: SyntheticEvent) => {
    e?.stopPropagation()
    e?.preventDefault()
    if (!multi) return
    setIndex(((next % images.length) + images.length) % images.length)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || !multi) return
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current
    const delta = endX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 36) return
    e.stopPropagation()
    go(delta < 0 ? index + 1 : index - 1)
  }

  if (!images.length || failed[index]) {
    const allFailed =
      images.length > 0 && images.every((_, i) => failed[i])
    if (!images.length || (failed[index] && (!multi || allFailed))) {
      return (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center bg-muted/40",
            className
          )}
        >
          <Coffee className="h-10 w-10 text-muted-foreground/30" />
        </div>
      )
    }
  }

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-muted/40",
        className
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") {
          ;(e.currentTarget as HTMLElement).dataset.dragX = String(e.clientX)
        }
      }}
      onPointerUp={(e) => {
        if (e.pointerType !== "mouse" || !multi) return
        const start = Number(
          (e.currentTarget as HTMLElement).dataset.dragX || e.clientX
        )
        const delta = e.clientX - start
        if (Math.abs(delta) < 40) return
        e.stopPropagation()
        go(delta < 0 ? index + 1 : index - 1)
      }}
    >
      {!failed[index] ? (
        <img
          src={images[index]}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-contain p-2 select-none",
            imgClassName
          )}
          draggable={false}
          loading="lazy"
          decoding="async"
          onError={() =>
            setFailed((prev) => ({ ...prev, [index]: true }))
          }
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Coffee className="h-10 w-10 text-muted-foreground/30" />
        </div>
      )}

      {multi && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex items-center justify-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              data-carousel-nav
              aria-label={`Image ${i + 1} of ${images.length}`}
              aria-current={i === index}
              className={cn(
                "pointer-events-auto h-1.5 w-1.5 cursor-pointer rounded-full transition-all",
                i === index
                  ? "scale-125 bg-zinc-900 shadow-sm ring-1 ring-white/90 dark:bg-white"
                  : "bg-zinc-400/80 hover:bg-zinc-500 dark:bg-zinc-500"
              )}
              onClick={(e) => go(i, e)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
