"use client";

import type { GenerationRun } from "@/api/definitions/models/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Separator } from "@/components/shadcn/separator";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import type { FC, KeyboardEvent } from "react";

type Props = {
  imageUrl: string;
  latestRun?: GenerationRun | null;
  onNext?: () => void;
  onOpenChange: (open: boolean) => void;
  onPrevious?: () => void;
  open: boolean;
  username?: string;
};

export const AvatarDialog: FC<Props> = ({
  open,
  onOpenChange,
  imageUrl,
  latestRun,
  onNext,
  onPrevious,
  username,
}) => {
  const hints = (latestRun?.inputData ?? []).toSorted(
    (a, b) => b.hours - a.hours,
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" && onPrevious) {
      onPrevious();
    } else if (e.key === "ArrowRight" && onNext) {
      onNext();
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-[90vw] w-full" onKeyDown={handleKeyDown}>
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

            {onPrevious && (
              <Button
                aria-label="Previous avatar"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white hover:bg-black/80 hover:text-white"
                onClick={onPrevious}
                size="icon"
                variant="ghost"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}

            {onNext && (
              <Button
                aria-label="Next avatar"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white hover:bg-black/80 hover:text-white"
                onClick={onNext}
                size="icon"
                variant="ghost"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
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
