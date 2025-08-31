"use client";

import { HomeHeader } from "@/app/home/HomeHeader";
import { AppSidebar } from "@/components/pages/AppSidebar";
import { SidebarProvider } from "@/components/shadcn/sidebar";
import { sidebarBehaviorAtom } from "@/state/preferences";
import { useAtomValue } from "jotai";

interface SidebarWithPreferencesProps {
  children: React.ReactNode;
}

export const SidebarWithPreferences: React.FC<SidebarWithPreferencesProps> = ({
  children,
}) => {
  const sidebarBehavior = useAtomValue(sidebarBehaviorAtom);

  return (
    <SidebarProvider
      className="flex flex-col [--header-height:3.5rem] p-0"
      defaultOpen={false}
    >
      <HomeHeader />
      <div className="flex w-full">
        <AppSidebar
          collapsible={sidebarBehavior === "permanent" ? "none" : "offcanvas"}
          variant={sidebarBehavior === "floating" ? "floating" : "sidebar"}
        />
        {children}
      </div>
    </SidebarProvider>
  );
};
