import type { ButtonHTMLAttributes, FC } from "react";
import { cn } from "@/lib/utils";

export type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export const Switch: FC<SwitchProps> = ({ checked, onCheckedChange, className, ...props }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      checked ? "bg-primary" : "bg-input",
      className,
    )}
    {...props}
  >
    <span
      className={cn(
        "block h-4 w-4 rounded-full bg-foreground transition-transform",
        checked ? "translate-x-4" : "translate-x-0.5",
      )}
    />
  </button>
);
