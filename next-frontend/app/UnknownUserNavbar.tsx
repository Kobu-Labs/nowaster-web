"use client";
import { Navigation, NowasterLogo } from "@/components/pages/main-nav";
import { ThemeToggle } from "@/components/pages/ThemeToggle";
import { Button } from "@/components/shadcn/button";
import { NavItem } from "@/types/nav";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { ArrowBigRight, Clock, Github } from "lucide-react";
import Link from "next/link";
import type React from "react";

const landingPageNav: NavItem[] = [] as const;

export function UnknownUserNavbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between w-full">
          <div className="flex items-center gap-2 w-full">
            <NowasterLogo />
            <Navigation items={landingPageNav}></Navigation>
            <div className="grow"></div>
            <ThemeToggle />
            <SignedIn>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-2"
              >
                <Link href="/home/">Go to application</Link>
                <ArrowBigRight />
              </Button>
            </SignedIn>
            <SignedOut>
              <SignInButton forceRedirectUrl={"/home"}>
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
            <Clock className="h-6 w-6" />
            <p className="text-center text-sm leading-loose md:text-left">
              &copy; {new Date().getFullYear()} Nowaster. All rights reserved.
            </p>
          </div>
          <Button className="flex items-center gap-4" variant="link">
            <Link
              rel="noopener noreferrer"
              target="_blank"
              href="https://github.com/Kobu-Labs/nowaster-web"
              className="flex items-center gap-1 text-sm font-medium"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
