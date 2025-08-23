"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Label } from "@/components/shadcn/label";
import { Switch } from "@/components/shadcn/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  closeSidebarOnLinkClickAtom,
  sidebarBehaviorAtom,
} from "@/state/preferences";
import { useAtom } from "jotai";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function PreferencesPage() {
  const [closeSidebarOnLinkClick, setCloseSidebarOnLinkClick] = useAtom(
    closeSidebarOnLinkClickAtom,
  );
  const [sidebarBehavior, setSidebarBehavior] = useAtom(sidebarBehaviorAtom);
  const searchParams = useSearchParams();
  const [highlightedSetting, setHighlightedSetting] = useState<string | null>(
    null,
  );
  const sidebarBehaviorRef = useRef<HTMLDivElement>(null);
  const closeSidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setting = searchParams.get("setting");
    if (setting) {
      setHighlightedSetting(setting);

      const scrollToElement = () => {
        let targetRef;
        switch (setting) {
        case "sidebar-behavior":
          targetRef = sidebarBehaviorRef;
          break;
        case "close-sidebar":
          targetRef = closeSidebarRef;
          break;
        default:
          targetRef = null;
          break;
        }

        if (targetRef?.current) {
          targetRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      };

      setTimeout(scrollToElement, 100);

      const timer = setTimeout(() => {
        setHighlightedSetting(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
    // INFO: placeholder to keep type system happy
    /* eslint-disable @typescript-eslint/no-empty-function */
    return () => {};
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Customize your app experience and behavior
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Navigation</CardTitle>
          <CardDescription>
            Control how the navigation sidebar behaves
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            ref={sidebarBehaviorRef}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg transition-all duration-1000",
              highlightedSetting === "sidebar-behavior" &&
                "bg-accent/20 shadow-lg ring-2 ring-accent",
            )}
          >
            <div className="space-y-0.5">
              <Label htmlFor="sidebar-behavior">Sidebar behavior</Label>
              <p className="text-sm text-muted-foreground">
                Choose how the sidebar behaves when opened
              </p>
            </div>
            <Select value={sidebarBehavior} onValueChange={setSidebarBehavior}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="floating">Floating</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div
            ref={closeSidebarRef}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg transition-all duration-300",
              highlightedSetting === "close-sidebar" &&
                "bg-accent/20 shadow-lg ring-2 ring-accent",
            )}
          >
            <div className="space-y-0.5">
              <Label htmlFor="close-sidebar">Close sidebar on link click</Label>
              <p className="text-sm text-muted-foreground">
                Automatically close the sidebar when navigating to a new page
              </p>
              <p className="text-sm text-muted-foreground">
                (Applies only to floating sidebar)
              </p>
            </div>
            <Switch
              id="close-sidebar"
              checked={closeSidebarOnLinkClick}
              onCheckedChange={setCloseSidebarOnLinkClick}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
