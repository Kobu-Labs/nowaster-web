import { NowasterLogo } from "@/components/pages/NowasterLogo";
import { SidebarTrigger } from "@/components/shadcn/sidebar";
import { Separator } from "@radix-ui/react-separator";
import { FC } from "react";

export const HomeHeader: FC = () => {
  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-[var(--header-height)] w-full items-center gap-2 px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" />
        <NowasterLogo href="/home/" />
      </div>
    </header>
  );
};
