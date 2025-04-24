"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

import { NavItem } from "@/types/nav";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { ActiveSession } from "@/components/visualizers/sessions/ActiveSession";
import Image from "next/image";

interface MainNavProps {
  items?: readonly NavItem[];
}

export function MainNav({ items }: MainNavProps) {
  const currentPath = usePathname();

  return (
    <div className="flex w-full flex-row gap-6">
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

      {items?.length ? (
        <nav className="flex gap-6">
          {items?.map(
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
        </nav>
      ) : null}
      <div className="grow"></div>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <ActiveSession />
    </div>
  );
}
