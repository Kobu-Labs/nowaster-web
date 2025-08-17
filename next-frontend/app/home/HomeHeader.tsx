import { NowasterLogo } from "@/components/pages/NowasterLogo";
import { SidebarTrigger } from "@/components/shadcn/sidebar";
import { UserButton } from "@clerk/nextjs";
import { FC } from "react";
import { Separator } from "@/components/shadcn/separator";
import { SessionTimer } from "@/components/visualizers/sessions/StartSession";
import { NotificationPopover } from "@/components/notifications/NotificationPopover";

export const HomeHeader: FC = () => {
  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="flex h-[var(--header-height)] w-full items-center gap-2 px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="w-[2px]" />
        <NowasterLogo href="/home/" />
        <div className="grow"></div>
        <SessionTimer />
        <NotificationPopover />
        <UserButton />
      </div>
    </header>
  );
};
