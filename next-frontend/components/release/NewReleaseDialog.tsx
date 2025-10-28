"use client";

import { useLatestUnseenRelease } from "@/components/hooks/release/useReleases";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { type FC, useEffect, useState } from "react";

export const NewReleaseDialog: FC = () => {
  const { data, isLoading } = useLatestUnseenRelease();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpen(true);
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    // Release is automatically marked as seen when latest-unseen is fetched
    setOpen(false);
  };

  if (isLoading || !data?.unseen) {
    return null;
  }

  const { release } = data;

  return (
    <Dialog
      modal={false}
      onOpenChange={(newOpen) => !newOpen && handleClose()}
      open={open}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle className="text-2xl">What&apos;s New</DialogTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{release.name}</span>
            <Badge variant="secondary">{release.version}</Badge>
          </div>
        </DialogHeader>

        <div className="py-4">
          {release.short_description && (
            <p className="text-sm text-muted-foreground">
              {release.short_description}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={handleClose} variant="outline">
            Dismiss
          </Button>
          <Link href={`/releases/${release.version}`} onClick={handleClose}>
            <Button className="w-full sm:w-auto">View Details</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
