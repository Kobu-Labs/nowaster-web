"use client";

import {
  ChartPie,
  BookTemplate as FileTemplate,
  History,
  Home,
  Plus,
  Tag,
  Users,
  X,
} from "lucide-react";

import { useCategories } from "@/components/hooks/category/useCategory";
import { NowasterLogo } from "@/components/pages/NowasterLogo";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/shadcn/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/shadcn/sidebar";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { ScheduledSessionCreationForm } from "@/components/visualizers/sessions/form/ScheduledSessionCreationForm";
import { SessionTimer } from "@/components/visualizers/sessions/StartSession";
import Link from "next/link";
import { useTags } from "@/components/hooks/tag/useTags";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";

const SHOW_CATEGORY_AMOUNT = 5;
const SHOW_TAG_AMOUNT = 7;

const navItems = [
  {
    title: "Dashboard",
    url: "/home",
    icon: Home,
  },
  {
    title: "Templates",
    url: "/home/templates",
    icon: FileTemplate,
  },
  {
    title: "Tags",
    url: "/home/tags",
    icon: Tag,
  },
  {
    title: "Categories",
    url: "/home/category",
    icon: ChartPie,
  },
  {
    title: "Friends",
    url: "/home/friends",
    icon: Users,
  },
  {
    title: "History",
    url: "/home/history",
    icon: History,
  },
] as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { toggleSidebar } = useSidebar();

  const categories = useCategories();
  const tags = useTags();
  if (!categories.data || !tags.data) {
    // INFO: do not render sidebar when data is not loaded, subject to change
    return null;
  }

  return (
    <Sidebar
      {...props}
      className="top-[var(--header-height)] !h-[calc(100svh-var(--header-height))] w-72"
    >
      <SidebarHeader className="flex flex-row items-center px-4 justify-between gradient-button">
        <NowasterLogo href="/home" />
        <Button
          variant="ghost"
          className="hover:bg-accent p-0 m-0 aspect-square"
          onClick={toggleSidebar}
        >
          <X />
        </Button>
      </SidebarHeader>

      <SidebarContent className="gradient-card">
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="grid grid-cols-1 gap-2 px-2">
              <SessionTimer />
              <Dialog modal={false}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                    Quick Log
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-fit max-w-fit">
                  <ScheduledSessionCreationForm />
                </DialogContent>
              </Dialog>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Categories</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-2">
              {categories.data
                .slice(0, SHOW_CATEGORY_AMOUNT)
                .map((category) => (
                  <Link
                    href={"/home/category/" + category.id}
                    key={category.id}
                    className="flex items-center gap-2 p-2 rounded-md justify-between hover:bg-sidebar-accent/50 cursor-pointer"
                  >
                    <CategoryBadge
                      color={category.color}
                      name={category.name}
                    />
                    <Badge variant="outline" className="text-xs">
                      {category.sessionCount}
                    </Badge>
                  </Link>
                ))}
              {categories.data.length > SHOW_CATEGORY_AMOUNT && (
                <Link href={"/home/category"}>
                  <SidebarMenuButton className="text-muted-foreground flex items-center justify-center">
                    <p className="text-accent-foreground">
                      {categories.data.length - SHOW_CATEGORY_AMOUNT}
                    </p>
                    <p>more..</p>
                  </SidebarMenuButton>
                </Link>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tags</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2 px-2">
              {tags.data.slice(0, SHOW_TAG_AMOUNT).map((tag) => (
                <Link
                  href={"/home/tags/" + tag.id}
                  key={tag.id}
                  className="flex items-center gap-2 p-2 rounded-md justify-between hover:bg-sidebar-accent/50 cursor-pointer"
                >
                  <TagBadge variant="auto" tag={tag} />
                  <Badge variant="outline" className="text-xs">
                    {tag.usages}
                  </Badge>
                </Link>
              ))}
              {tags.data.length > SHOW_TAG_AMOUNT && (
                <Link href={"/home/tags"}>
                  <SidebarMenuButton className="text-muted-foreground flex items-center justify-center">
                    <p className="text-accent-foreground">
                      {tags.data.length - SHOW_TAG_AMOUNT}
                    </p>
                    <p>more..</p>
                  </SidebarMenuButton>
                </Link>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* placeholder for footer */}
      <SidebarFooter className="bg-pink-muted">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild></SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
