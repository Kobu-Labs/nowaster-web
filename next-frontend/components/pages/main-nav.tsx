"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/nav";
import type { FC, PropsWithChildren } from "react";

type NavigationProps = {
  items?: readonly NavItem[];
};

export const Navigation: FC<PropsWithChildren<NavigationProps>> = (props) => {
  const currentPath = usePathname();

  return (
    <nav className="flex gap-6">
      {props.items?.map(
        (item, index) =>
          item.href && (
            <Link
              className={cn(
                "flex items-center text-sm font-medium text-muted-foreground hover:text-primary",
                item.disabled && "cursor-not-allowed opacity-80",
              )}
              href={item.href}
              key={index}
            >
              <div className={cn("group rounded transition duration-200")}>
                {item.title}
                <span
                  className={cn(
                    "block h-0.5 max-w-0 bg-accent-foreground transition-all duration-200 group-hover:max-w-full",
                    currentPath === item.href && "max-w-full",
                  )}
                >
                </span>
              </div>
            </Link>
          ),
      )}
      {props.children}
    </nav>
  );
};
