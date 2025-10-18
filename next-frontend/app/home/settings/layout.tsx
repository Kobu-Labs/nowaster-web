"use client";

import { SettingsSidebar } from "@/components/pages/settings/SettingsSidebar";
import { SidebarInset, SidebarProvider } from "@/components/shadcn/sidebar";

type SettingsLayoutProps = {
  children: React.ReactNode;
};

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex h-full w-full">
      <SidebarProvider className="flex-1" defaultOpen>
        <SettingsSidebar />
        <SidebarInset className="flex-1">
          <div className="p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
