import { Button } from "@/components/shadcn/button";
import { ArrowBigRight } from "lucide-react";
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
        <span className="inline-block font-bold">Nowaster</span>
      </Link>
      <nav className="flex-1 flex justify-end" aria-label="Main navigation">
        <Link href="/home/">
          <Button aria-label="Navigate to application">
            Go to application
            <ArrowBigRight aria-hidden="true" />
          </Button>
        </Link>
      </nav>
    </header>
  );
}
