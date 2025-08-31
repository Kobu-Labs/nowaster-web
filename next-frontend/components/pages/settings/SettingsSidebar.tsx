"use client";

import { Rss, Settings, Shield, Sliders } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/shadcn/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsNavItems = [
  {
    description: "Manage your feed subscriptions",
    icon: Rss,
    title: "Feed",
    url: "/home/settings/feed",
  },
  {
    description: "Control who can see your activity",
    icon: Shield,
    title: "Privacy",
    url: "/home/settings/visibility",
  },
] as const;

const preferencesNavItems = [
  {
    description: "Customize your app experience",
    icon: Sliders,
    title: "Preferences",
    url: "/home/settings/preferences",
  },
] as const;

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      className="w-64 border-r bg-transparent"
      collapsible="none"
      variant="sidebar"
    >
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Settings</h2>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="my-2">
          <SidebarGroupLabel>Social</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link className="flex items-start gap-1" href={item.url}>
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="my-2">
          <SidebarGroupLabel>Preferences</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {preferencesNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link className="flex items-start gap-1" href={item.url}>
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
