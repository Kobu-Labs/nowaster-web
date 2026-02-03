"use client";

import { Settings, UserCog } from "lucide-react";

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

const adminNavItems = [
  {
    description: "User impersonation and management",
    icon: UserCog,
    title: "Impersonation",
    url: "/home/admin/impersonation",
  },
] as const;

export const AdminSidebar: React.FC = () => {
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
          <h2 className="text-lg font-semibold">Admin Portal</h2>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="my-2">
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
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
};
