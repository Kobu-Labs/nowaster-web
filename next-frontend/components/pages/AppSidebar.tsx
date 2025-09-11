"use client";

import {
  ChartPie,
  BookTemplate as FileTemplate,
  History,
  Home,
  Plus,
  Rss,
  Settings,
  Tag,
  Users,
  X,
} from "lucide-react";

import { useCategories } from "@/components/hooks/category/useCategory";
import { useTags } from "@/components/hooks/tag/useTags";
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
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { cn } from "@/lib/utils";
import {
  closeSidebarOnLinkClickAtom,
  sidebarBehaviorAtom,
} from "@/state/preferences";
import { useAtom, useAtomValue } from "jotai";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const SHOW_CATEGORY_AMOUNT = 5;
const SHOW_TAG_AMOUNT = 7;

const navItems = [
  {
    icon: Home,
    title: "Dashboard",
    url: "/home",
  },
  {
    icon: Rss,
    title: "Feed",
    url: "/home/feed",
  },
  {
    icon: FileTemplate,
    title: "Templates",
    url: "/home/templates",
  },
  {
    icon: Tag,
    title: "Tags",
    url: "/home/tags",
  },
  {
    icon: ChartPie,
    title: "Categories",
    url: "/home/category",
  },
  {
    icon: Users,
    title: "Friends",
    url: "/home/friends",
  },
  {
    icon: History,
    title: "History",
    url: "/home/history",
  },
  {
    icon: Settings,
    title: "Settings",
    url: "/home/settings",
  },
] as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { toggleSidebar } = useSidebar();
  const [closeSidebarOnLinkClick] = useAtom(closeSidebarOnLinkClickAtom);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const pref = useAtomValue(sidebarBehaviorAtom);

  const categories = useCategories();
  const tags = useTags();
  const pathname = usePathname();
  const [currentLink, setCurrentLink] = useState(pathname);

  const sortedTags = useMemo(
    () => tags.data?.toSorted((a, b) => b.usages - a.usages),
    [tags.data],
  );

  const sortedCategories = useMemo(
    () => categories.data?.toSorted((a, b) => b.sessionCount - a.sessionCount),
    [categories.data],
  );

  const handleLinkClick = (href: string) => {
    setCurrentLink(href);
    if (closeSidebarOnLinkClick) {
      toggleSidebar();
    }
  };

  if (!sortedCategories || !sortedTags) {
    // INFO: do not render sidebar when data is not loaded, subject to change
    return null;
  }

  return (
    <Sidebar
      {...props}
      className={cn(
        "top-(--header-height) w-72 h-[calc(100svh-var(--header-height))]! ",
        pref === "floating" && "p-0",
        pref === "permanent" && "h-full",
      )}
    >
      <SidebarHeader className="flex flex-row items-center px-4 justify-between gradient-button">
        <NowasterLogo href="/home">
          <p className="font-bold text-2xl">Nowaster</p>
        </NowasterLogo>
        {pref !== "permanent" && (
          <Button
            className="hover:bg-accent p-0 m-0 aspect-square"
            onClick={toggleSidebar}
            variant="ghost"
          >
            <X />
          </Button>
        )}
      </SidebarHeader>

      <SidebarContent className="gradient-card">
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="grid grid-cols-1 gap-2 px-2">
              <SessionTimer />
              <Dialog
                modal={false}
                onOpenChange={setShowQuickLog}
                open={showQuickLog}
              >
                <DialogTrigger asChild>
                  <Button
                    className="justify-start gap-2 bg-transparent"
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    Quick Log
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-fit max-w-fit">
                  <ScheduledSessionCreationForm
                    onClose={() => setShowQuickLog(false)}
                    onCreateAndClose={() => setShowQuickLog(false)}
                  />
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
                <SidebarMenuItem
                  key={item.title}
                  onClick={() => { handleLinkClick(item.url); }}
                >
                  <SidebarMenuButton asChild>
                    <Link
                      className={cn(
                        "flex items-center gap-2",
                        currentLink === item.url && "bg-accent",
                        currentLink !== item.url
                        && "hover:bg-sidebar-accent/50",
                      )}
                      href={item.url}
                    >
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
              {sortedCategories
                .slice(0, SHOW_CATEGORY_AMOUNT)
                .map((category) => (
                  <Link
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md justify-between cursor-pointer",
                      currentLink === `/home/category/${category.id}`
                      && "bg-accent",
                      currentLink !== `/home/category/${category.id}`
                      && "hover:bg-sidebar-accent/50",
                    )}
                    href={`/home/category/${category.id}`}
                    key={category.id}
                    onClick={() =>
                    { handleLinkClick(`/home/category/${category.id}`); }}
                  >
                    <CategoryBadge
                      color={category.color}
                      name={category.name}
                    />
                    <Badge className="text-xs" variant="outline">
                      {category.sessionCount}
                    </Badge>
                  </Link>
                ))}
              {sortedCategories.length > SHOW_CATEGORY_AMOUNT && (
                <Link
                  href="/home/category"
                  onClick={() => { handleLinkClick("/home/category/"); }}
                >
                  <SidebarMenuButton className="text-muted-foreground flex items-center justify-center">
                    <p className="text-accent-foreground">
                      {sortedCategories.length - SHOW_CATEGORY_AMOUNT}
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
              {sortedTags.slice(0, SHOW_TAG_AMOUNT).map((tag) => (
                <Link
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md justify-between cursor-pointer",
                    currentLink === `/home/tags/${tag.id}` && "bg-accent",
                    currentLink !== `/home/tags/${tag.id}`
                    && "hover:bg-sidebar-accent/50",
                  )}
                  href={`/home/tags/${tag.id}`}
                  key={tag.id}
                  onClick={() => { handleLinkClick(`/home/tags/${tag.id}`); }}
                >
                  <TagBadge tag={tag} variant="auto" />
                  <Badge className="text-xs" variant="outline">
                    {tag.usages}
                  </Badge>
                </Link>
              ))}
              {sortedTags.length > SHOW_TAG_AMOUNT && (
                <Link
                  href="/home/tags"
                  onClick={() => { handleLinkClick("/home/tags/"); }}
                >
                  <SidebarMenuButton className="text-muted-foreground flex items-center justify-center">
                    <p className="text-accent-foreground">
                      {sortedTags.length - SHOW_TAG_AMOUNT}
                    </p>
                    <p>more..</p>
                  </SidebarMenuButton>
                </Link>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

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
