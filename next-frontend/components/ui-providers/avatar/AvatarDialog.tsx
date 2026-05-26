"use client";

import type { GenerationRun, UserAvatar } from "@/api/definitions/models/avatar";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  avatar: UserAvatar;
  latestRun: GenerationRun | null;
  username: string;
};

export const AvatarDialog: FC<Props> = ({
  open,
  onOpenChange,
  avatar,
  latestRun,
  username,
}) => {
  const hints =
    latestRun?.inputData
      ?.split(",")
      .filter(Boolean)
      .map((entry) => {
        const [label, hours] = entry.split(":");
        return { hours: Number(hours), label };
      }) ?? [];

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{username}&apos;s Avatar</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {avatar.currentImageUrl && (
            <div className="relative h-64 w-64 overflow-hidden rounded-lg">
              <Image
                alt={`${username}'s avatar`}
                className="object-cover"
                fill
                src={avatar.currentImageUrl}
              />
            </div>
          )}

          {latestRun && (
            <>
              <Separator />
              <div className="w-full space-y-2">
                <p className="text-sm font-medium">
                  Generated{" "}
                  {format(latestRun.completedAt ?? latestRun.createdAt, "PPP")}
                </p>
                {hints.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Based on activity
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {hints.map(({ label, hours }) => (
                        <Badge
                          className="gap-1"
                          key={label}
                          variant="secondary"
                        >
                          {label}
                          <span className="text-muted-foreground">
                            {hours}h
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
