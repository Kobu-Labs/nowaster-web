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
import { closeSidebarOnLinkClickAtom } from "@/state/preferences";
import { useAtom } from "jotai";

export default function PreferencesPage() {
  const [closeSidebarOnLinkClick, setCloseSidebarOnLinkClick] = useAtom(
    closeSidebarOnLinkClickAtom,
  );

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
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="close-sidebar">Close sidebar on link click</Label>
              <p className="text-sm text-muted-foreground">
                Automatically close the sidebar when navigating to a new page
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
