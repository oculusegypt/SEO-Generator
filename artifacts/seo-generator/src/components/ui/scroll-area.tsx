import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

export interface ScrollAreaProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"
    return (
      <Comp
        ref={ref}
        className={cn("overflow-auto", className)}
        {...props}
      />
    )
  }
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }