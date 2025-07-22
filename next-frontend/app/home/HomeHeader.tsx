import { NowasterLogo } from "@/components/pages/NowasterLogo";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { SidebarTrigger } from "@/components/shadcn/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { FC } from "react";
import { Separator } from "@/components/shadcn/separator";

export const HomeHeader: FC = () => {
  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-[var(--header-height)] w-full items-center gap-2 px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="w-[2px]" />
        <NowasterLogo href="/home/" />
        <div className="grow"></div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-accent">
                ?
              </Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="text-nowrap w-fit">
            Coming soon.
          </PopoverContent>
        </Popover>

        <UserButton />
      </div>
    </header>
  );
};
