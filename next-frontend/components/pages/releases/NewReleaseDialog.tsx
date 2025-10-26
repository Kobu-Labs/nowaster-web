"use client";

import { useLatestUnseenRelease } from "@/components/hooks/release/useReleases";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import Link from "next/link";
import { useEffect, useState, type FC } from "react";
import { Sparkles } from "lucide-react";

export const NewReleaseDialog: FC = () => {
  const { data, isLoading } = useLatestUnseenRelease();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show dialog if there's an unseen release
    if (data && data.unseen) {
      setOpen(true);
    }
  }, [data]);

  const handleClose = () => {
    // Release is automatically marked as seen when latest-unseen is fetched
    setOpen(false);
  };

  if (isLoading || !data || !data.unseen) {
    return null;
  }

  const { release } = data;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle className="text-2xl">What's New</DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-2">
            <span>{release.name}</span>
            <Badge variant="secondary">{release.version}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {release.short_description && (
            <p className="text-sm text-muted-foreground">
              {release.short_description}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose}>
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
