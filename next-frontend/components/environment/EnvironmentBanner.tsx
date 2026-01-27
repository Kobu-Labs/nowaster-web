"use client";

import { env } from "@/env";
import { Button } from "@/components/shadcn/button";
import { AlertTriangle, FlaskConical } from "lucide-react";
import { type FC, useEffect, useState } from "react";

function getTimeUntilNextReset(): string {
  const now = new Date();
  const next3amUtc = new Date();
  next3amUtc.setUTCHours(3, 0, 0, 0);
  if (now >= next3amUtc) {
    next3amUtc.setUTCDate(next3amUtc.getUTCDate() + 1);
  }

  const diffMs = next3amUtc.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

export const EnvironmentBanner: FC = () => {
  const appEnv = env.NEXT_PUBLIC_APP_ENV;
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilNextReset);

  useEffect(() => {
    if (appEnv !== "nowaster-sandbox") {
      return;
    }

    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilNextReset());
    }, 1000);

    return () => clearInterval(interval);
  }, [appEnv]);

  if (appEnv === "nowaster-sandbox") {
    return (
      <div className="bg-orange-500 text-orange-950 px-4 py-2 flex items-center justify-between sticky top-[var(--header-height)] z-40">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 shrink-0" />
          <span className="font-medium">
            Sandbox environment — all data will be wiped in no less than
            {" "}
            <span className="font-bold">{timeUntilReset}</span>
            {" "}
            (resets daily at
            3:00 AM UTC)
          </span>
        </div>
        <Button
          asChild
          className="shrink-0 bg-white text-white hover:bg-orange-50 font-semibold"
          size="sm"
        >
          <a href="https://www.nowaster.app">Use the real app →</a>
        </Button>
      </div>
    );
  }

  if (appEnv === "nowaster-staging") {
    return (
      <div className="bg-yellow-500 text-yellow-950 px-4 py-2 flex items-center justify-between sticky top-[var(--header-height)] z-40">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">
            Staging environment — data here can and probably will be deleted
            without notice
          </span>
        </div>
        <Button
          asChild
          className="shrink-0 bg-white text-white hover:bg-yellow-50 font-semibold"
          size="sm"
        >
          <a href="https://www.nowaster.app">Use the real app →</a>
        </Button>
      </div>
    );
  }

  return null;
};
