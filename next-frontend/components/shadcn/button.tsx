import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-10 px-4 py-2",
        icon: "h-10 w-10",
        lg: "h-11 rounded-md px-8",
        sm: "h-9 rounded-md px-3",
      },
      variant: {
        default: "gradient-button",
        destructive: "bg-destructive/80",
        ghost: "hover:gradient-icon-container hover:text-accent-foreground",
        link: "text-pink-primary gradient-text-hover transition-all hover:transition-all duration-300 relative inline-block after:content-[''] after:absolute after:left-1/2 after:bottom-2 after:h-[2px] after:bg-primary after:w-0 after:transition-all after:duration-300 hover:after:left-0 hover:after:w-full",
        outline: cn(
          "border  border-2  hover:text-accent-foreground",
          "relative overflow-hidden transition-all duration-300 ease-in-out",
          "before:absolute before:inset-0 before:opacity-100 before:transition-opacity before:duration-300 before:ease-in-out before:gradient-container",
          "after:absolute after:inset-0 after:opacity-0 after:transition-opacity after:duration-300 after:ease-in-out after:gradient-container-subtle",
          "hover:before:opacity-0 hover:after:opacity-100",
        ),
        secondary: cn(
          "hover:text-accent-foreground",
          "relative overflow-hidden transition-all duration-300 ease-in-out",
          "before:absolute before:inset-0 before:opacity-100 before:transition-opacity before:duration-300 before:ease-in-out before:gradient-container",
          "after:absolute after:inset-0 after:opacity-0 after:transition-opacity after:duration-300 after:ease-in-out after:gradient-container-subtle",
          "hover:before:opacity-0 hover:after:opacity-100",
        ),
      },
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      children,
      className,
      loading = false,
      size,
      variant,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ className, size, variant }))}
        disabled={loading}
        ref={ref}
        {...props}
      >
        {loading && <LoaderCircle className="animate-spin" />}
        <Slottable>{children}</Slottable>
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
