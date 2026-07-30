import { Coffee } from "lucide-react"
import { cn } from "@/lib/utils"

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
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn("h-full w-full object-cover", className)}
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