"use client";

import { useCurrentUser } from "@/components/hooks/user/useCurrentUser";
import { VisibilitySettings } from "@/components/pages/settings/visibility/VisibilitySettings";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/shadcn/card";

export default function VisibilitySettingsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VisibilitySettingsContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-8 bg-muted rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
}

function VisibilitySettingsContent() {
  const user = useCurrentUser();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Privacy Settings</h1>
      <p className="text-muted-foreground mb-6">
        Control who can see your activity and time tracking sessions.
      </p>

      <VisibilitySettings user={user} />
    </div>
  );
}
