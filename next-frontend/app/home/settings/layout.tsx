"use client";

import { SettingsSidebar } from "@/components/pages/settings/SettingsSidebar";
import { SidebarInset, SidebarProvider } from "@/components/shadcn/sidebar";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex h-full w-full">
      <SidebarProvider defaultOpen className="flex-1">
        <SettingsSidebar />
        <SidebarInset className="flex-1">
          <div className="p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
