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
                "flex items-center text-sm font-medium text-muted-foreground hover:text-white",
                item.disabled && "cursor-not-allowed opacity-80",
                currentPath === item.href && "text-white",
              )}
            >
              {item.title}
            </Link>
          ),
      )}
      {props.children}
    </nav>
  );
};

export const NowasterLogo = () => {
  return (
    <Link
      href="/"
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
      <NowasterLogo />
      <Navigation items={items}>
        <div className="grow"></div>
        <SessionTimer />
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </Navigation>
    </div>
  );
} 
