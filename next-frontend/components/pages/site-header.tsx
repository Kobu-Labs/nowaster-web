import { Navigation } from "@/components/pages/main-nav";
import { NowasterLogo } from "@/components/pages/NowasterLogo";
import { Button } from "@/components/shadcn/button";
import { NavItem } from "@/types/nav";
import { ArrowBigRight } from "lucide-react";
import Link from "next/link";

const landingPageNav: NavItem[] = [] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between w-full">
        <div className="flex items-center gap-2 w-full">
          <NowasterLogo />
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
