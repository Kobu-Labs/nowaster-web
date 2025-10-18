import { Button } from "@/components/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Github, UserLock } from "lucide-react";
import Link from "next/link";

export const SiteFooter = () => {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
          <p className="text-center text-sm leading-loose  text-muted-foreground">
            &copy; {new Date().getFullYear()} Nowaster. All rights reserved.
          </p>
          <Button className="flex items-center gap-4" variant="link">
            <Link
              className="flex items-center gap-1 text-sm font-medium"
              href="/privacy-policy"
            >
              <UserLock className="h-4 w-4" />
              Privacy Policy
            </Link>
          </Button>
        </div>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="flex items-center gap-4" variant="link">
                <Link
                  className="flex items-center gap-1 text-sm font-medium"
                  href="https://github.com/Kobu-Labs/nowaster-web"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="flex items-center justify-center gap-1">
              <InfoCircledIcon />
              This will open a new tab
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </footer>
  );
};
