"use client";

import { AppSidebar } from "@/components/pages/AppSidebar";
import { sidebarBehaviorAtom } from "@/state/preferences";
import { useAtomValue } from "jotai";

type SidebarWithPreferencesProps = {
  children: React.ReactNode;
};

export const SidebarWithPreferences: React.FC<SidebarWithPreferencesProps> = ({
  children,
}) => {
  const sidebarBehavior = useAtomValue(sidebarBehaviorAtom);

  return (
    <div className="flex w-full">
      <AppSidebar
        collapsible={sidebarBehavior === "permanent" ? "none" : "offcanvas"}
        variant={sidebarBehavior === "floating" ? "floating" : "sidebar"}
      />
      {children}
    </div>
  );
};
