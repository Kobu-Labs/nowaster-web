import { Navigation } from "@/components/pages/main-nav";
import { Button } from "@/components/shadcn/button";
import type { NavItem } from "@/types/nav";
import { ArrowBigRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const landingPageNav: NavItem[] = [] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between w-full">
        <div className="flex items-center gap-2 w-full">
          <Link
            className="flex items-center space-x-2 hover:scale-110 hover:transition"
            href="/"
          >
            <Image
              alt="Logo"
              className="h-8 w-8"
              height={80}
              src="/logo.png"
              width={80}
            />
            <span className="inline-block font-bold">Nowaster</span>
          </Link>
          <Navigation items={landingPageNav}></Navigation>
          <div className="grow"></div>
          <Link href="/home/">
            <Button>
              <p>Go to application</p>
              <ArrowBigRight />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
