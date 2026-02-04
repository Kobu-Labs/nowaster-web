import { SignedIn } from "@/components/auth/SignedIn";
import { SignedOut } from "@/components/auth/SignedOut";
import { WelcomeBackButton } from "@/components/auth/WelcomBackButton";
import { Button } from "@/components/shadcn/button";
import { Newspaper } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex h-16 items-center justify-between w-full px-4">
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
        <span className="inline-block font-bold hidden xs:block">Nowaster</span>
      </Link>
      <nav
        aria-label="Main navigation"
        className="flex-1 flex justify-end items-center gap-4"
      >
        <Button className="flex items-center gap-4" variant="link">
          <Link className="flex items-center gap-1 text-lg" href="/releases">
            <Newspaper className="h-4 w-4" />
            <span>Releases</span>
          </Link>
        </Button>
        <SignedIn>
          <Link href="/home">
            <WelcomeBackButton />
          </Link>
        </SignedIn>
        <SignedOut>
          <Link href="/sign-in">
            <Button variant="secondary">
              <p>Log in</p>
            </Button>
          </Link>
        </SignedOut>
      </nav>
    </header>
  );
}
