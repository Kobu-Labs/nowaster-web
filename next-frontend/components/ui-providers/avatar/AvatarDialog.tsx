"use client";

import type { GenerationRun } from "@/api/definitions/models/avatar";
import { Badge } from "@/components/shadcn/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Separator } from "@/components/shadcn/separator";
import { format } from "date-fns";
import Image from "next/image";
import type { FC } from "react";

type Props = {
  imageUrl: string;
  latestRun?: GenerationRun | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  username?: string;
};

export const AvatarDialog: FC<Props> = ({
  open,
  onOpenChange,
  imageUrl,
  latestRun,
  username,
}) => {
  const hints = (latestRun?.inputData ?? []).toSorted(
    (a, b) => b.hours - a.hours,
  );

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-[90vw] w-full">
        <DialogHeader>
          <DialogTitle>
            {username ? `${username}'s Avatar` : "Avatar"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {/* Image container constrained to dialog */}
          <div className="relative w-full max-w-[80vh] aspect-square overflow-hidden rounded-lg">
            <Image
              alt={username ? `${username}'s avatar` : "Avatar"}
              className="object-cover"
              fill
              sizes="80vh"
              src={imageUrl}
              unoptimized
            />
          </div>

          {latestRun?.status === "success" && (
            <>
              <Separator />

              <div className="w-full space-y-2">
                <p className="text-sm font-medium text-center">
                  Generated
                  {" "}
                  {format(latestRun.completedAt ?? latestRun.createdAt, "PPP")}
                </p>

                {hints.length > 0 && (
                  <div className="space-y-1 text-center">
                    <p className="text-xs text-muted-foreground">
                      Based on activity
                    </p>

                    <div className="flex flex-wrap justify-center gap-1">
                      {hints.map(({ label, hours }, i) => (
                        <Badge
                          className="gap-1"
                          key={`${label}-${i}`}
                          variant="secondary"
                        >
                          {label}
                          <span className="text-muted-foreground">
                            {hours}
                            h
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
