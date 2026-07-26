import { Coffee, Heart } from "lucide-react"

const Footer = () => {
  return (
    <footer className="border-t bg-background/95 py-3">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-1 text-center">
          <div className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Beaudesert Cafe</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Made with{" "}
            <Heart className="inline h-3 w-3 fill-red-500 text-red-500" /> for
            coffee lovers
          </p>
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} Beaudesert Cafe. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
