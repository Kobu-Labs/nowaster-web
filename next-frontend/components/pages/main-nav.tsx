"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

import { NavItem } from "@/types/nav";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { SessionTimer } from "@/components/visualizers/sessions/StartSession";
import { FC, PropsWithChildren } from "react";
import { ThemeToggle } from "@/components/pages/ThemeToggle";

interface NavigationProps {
  items?: readonly NavItem[];
}

export const Navigation: FC<PropsWithChildren<NavigationProps>> = (props) => {
  const currentPath = usePathname();

  return (
    <nav className="flex gap-6">
      {props.items?.map(
        (item, index) =>
          item.href && (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center text-sm font-medium text-muted-foreground hover:text-primary",
                item.disabled && "cursor-not-allowed opacity-80",
              )}
            >
              <div className={cn("group rounded transition duration-200")}>
                {item.title}
                <span
                  className={cn(
                    "block h-0.5 max-w-0 bg-accent-foreground transition-all duration-200 group-hover:max-w-full",
                    currentPath === item.href && "max-w-full",
                  )}
                ></span>
              </div>
            </Link>
          ),
      )}
      {props.children}
    </nav>
  );
};

export const NowasterLogo: FC<{ href?: string }> = (props) => {
  return (
    <Link
      href={props.href ?? "/"}
      className="flex items-center space-x-2 hover:scale-110 hover:transition"
    >
      <Image
        src="/logo.png"
        alt="Logo"
        className="h-8 w-8"
        width={80}
        height={80}
      />
      <span className="inline-block font-bold">{siteConfig.name}</span>
    </Link>
  );
};

export function MainNavigation({ items }: NavigationProps) {
  return (
    <div className="flex w-full flex-row gap-6">
      <NowasterLogo href="/home/" />
      <Navigation items={items} />
      <div className="grow"></div>
      <SessionTimer />
      <ThemeToggle />
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}
