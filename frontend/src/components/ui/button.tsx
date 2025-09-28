import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group will-change-auto",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-white shadow-glass hover:shadow-glow backdrop-blur-sm border border-ocean-200/20",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft",
        outline: "border border-ocean-200 bg-glacier-50/30 backdrop-blur-glass hover:bg-ocean-50/50 hover:border-ocean-300 text-ocean-700 shadow-glass",
        secondary: "bg-glacier-100/60 backdrop-blur-glass text-ocean-900 hover:bg-glacier-200/70 shadow-glass border border-glacier-200/50",
        ghost: "hover:bg-ocean-50/30 hover:text-ocean-700 backdrop-blur-sm",
        link: "text-ocean-600 underline-offset-4 hover:underline hover:text-ocean-800",
        hero: "bg-gradient-hero text-white shadow-glow hover:shadow-pet-glow hover:scale-105 font-semibold",
        whatsapp: "bg-whatsapp text-white hover:bg-whatsapp-dark shadow-glass hover:shadow-medium backdrop-blur-sm",
        success: "bg-success text-white hover:bg-success/90 shadow-glass backdrop-blur-sm",
        warning: "bg-warning text-white hover:bg-warning/90 shadow-glass backdrop-blur-sm",
        accent: "bg-ocean-500 text-white hover:bg-ocean-600 shadow-glass hover:shadow-pet-glow backdrop-blur-sm",
        glass: "glass-morphism text-ocean-700 hover:bg-ocean-50/20 hover:shadow-pet-glow",
        neuro: "neuro-morphism text-ocean-800 hover:text-ocean-900",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          // Simplified pet-themed hover effect
          "before:content-['🐾'] before:absolute before:top-1 before:right-1 before:text-xs before:opacity-0 before:transition-opacity before:duration-150 hover:before:opacity-20"
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
