import { Button } from "@/components/shadcn/button";
import { Clock, Github } from "lucide-react";
import Link from "next/link";

export const SiteFooter = () => {
  return (
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
  );
};
