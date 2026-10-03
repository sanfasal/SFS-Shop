import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const logoVariants = cva(
  "inline-flex shrink-0 items-center justify-center bg-brand-gradient text-white select-none",
  {
    variants: {
      size: {
        sm: "size-7 rounded-lg text-[1.375rem] shadow-sm",
        md: "size-8 rounded-lg text-2xl shadow-sm",
        lg: "size-14 rounded-2xl text-[2.75rem] shadow-md",
        xl: "size-44 rounded-[2.5rem] text-[8rem] shadow-2xl shadow-primary/30",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

type LogoProps = Omit<React.ComponentProps<"span">, "children"> &
  VariantProps<typeof logoVariants>;

/** The sfs-shop brand mark: a script "S" in a rounded tile. */
function Logo({ className, size, ...props }: LogoProps) {
  return (
    <span
      data-slot="logo"
      aria-hidden
      className={cn(logoVariants({ size }), className)}
      {...props}
    >
      {/* Great Vibes draws its glyphs high and to the right of the em box;
          this em-relative nudge optically centers the S at every size. */}
      <span
        className={cn(
          "font-logo leading-none -translate-x-[0.05em] translate-y-[0.14em]",
          size === "xl" && "drop-shadow-md"
        )}
      >
        S
      </span>
    </span>
  );
}

export { Logo, logoVariants };
