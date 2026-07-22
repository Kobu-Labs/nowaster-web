"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn/alert";
import { ChevronUp, Sparkles } from "lucide-react";
import { type FC, useEffect, useState } from "react";

const DISMISSED_KEY = "avatar-explainer-dismissed";

export const AvatarExplainer: FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY) === "1") {
      setCollapsed(true);
    }
  }, []);

  if (collapsed) {
    return null;
  }

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setCollapsed(true);
  };

  return (
    <Alert className="relative pr-10">
      <Sparkles className="h-4 w-4" />
      <AlertTitle>Dynamic Avatar</AlertTitle>
      <AlertDescription className="space-y-1 text-sm">
        <p>
          Your avatar is generated weekly from your tracked activity. The more
          you track, the more detailed it becomes.
        </p>
        <p>
          <strong>Hints</strong>
          {" "}
          let you guide the generation: instead of using
          a raw category name, you can attach custom labels that better describe
          your work (e.g. replace &quot;Work&quot; with &quot;coding&quot; or
          &quot;music&quot;).
        </p>
      </AlertDescription>
      <button
        aria-label="Dismiss explainer"
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        onClick={dismiss}
        type="button"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
    </Alert>
  );
};
