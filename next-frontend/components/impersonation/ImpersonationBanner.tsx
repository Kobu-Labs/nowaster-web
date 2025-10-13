"use client";

import { useImpersonation } from "@/components/hooks/useImpersonation";
import { Button } from "@/components/shadcn/button";
import { AlertTriangle } from "lucide-react";
import type { FC } from "react";

export const ImpersonationBanner: FC = () => {
  const { targetUser, stopImpersonation, isStopping } = useImpersonation();

  if (!targetUser) return null;

  return (
    <div className="bg-yellow-500 text-yellow-950 px-4 py-2 flex items-center justify-between sticky top-[var(--header-height)] z-40">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium">
          You are impersonating: {targetUser.username}
        </span>
      </div>
      <Button
        onClick={() => stopImpersonation()}
        disabled={isStopping}
        variant="secondary"
        size="sm"
      >
        {isStopping ? "Stopping..." : "Stop Impersonation"}
      </Button>
    </div>
  );
};
