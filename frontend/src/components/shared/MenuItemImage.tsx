import { Coffee } from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveMediaUrl } from "@/lib/mediaUrl"

interface MenuItemImageProps {
  src?: string
  alt: string
  className?: string
  iconClassName?: string
}

export function MenuItemImage({
  src,
  alt,
  className,
  iconClassName,
}: MenuItemImageProps) {
  const resolved = resolveMediaUrl(src)
  if (resolved) {
    return (
      <img
        src={resolved}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn("h-full w-full object-contain bg-muted/40", className)}
        onError={(e) => {
          e.currentTarget.style.display = "none"
        }}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-muted/40",
        className
      )}
    >
      <Coffee className={cn("h-10 w-10 text-muted-foreground/30", iconClassName)} />
    </div>
  )
}
