"use client"

import * as React from "react"
import { cn } from "cn"

function Label({
  className,
  required = false,
  children,
  ...props
}: React.ComponentProps<"label"> & {
  /** Marks the field as required with a red star after the text. */
  required?: boolean
}) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <>
          <span aria-hidden className="-ml-1.5 text-destructive">
            *
          </span>
          <span className="sr-only">(required)</span>
        </>
      )}
    </label>
  )
}

export { Label }
