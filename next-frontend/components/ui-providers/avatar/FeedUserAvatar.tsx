"use client";

import type { ReadUserAvatar } from "@/api/definitions/models/feed";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { getInitials } from "@/lib/utils";
import Image from "next/image";
import { type FC, useState } from "react";

type Props = {
  user: ReadUserAvatar;
  size?: "sm" | "md";
};

export const FeedUserAvatar: FC<Props> = ({ user, size = "md" }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const thumbUrl = user.avatar_thumb_url ?? undefined;
  const imageUrl = user.avatar_image_url ?? undefined;
  const hasFullImage = !!imageUrl;
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  return (
    <>
      <button
        aria-label={`View ${user.username}'s avatar`}
        className="rounded-full ring-offset-background transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-100"
        disabled={!hasFullImage}
        onClick={() => hasFullImage && setDialogOpen(true)}
        onMouseEnter={() => {
          if (imageUrl) {
            const img = new window.Image();
            img.src = imageUrl;
          }
        }}
        type="button"
      >
        <Avatar className={sizeClass}>
          {thumbUrl && <AvatarImage alt={user.username} src={thumbUrl} />}
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {getInitials(user.username)}
          </AvatarFallback>
        </Avatar>
      </button>

      {hasFullImage && (
        <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{user.username}&apos;s Avatar</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <div className="relative h-64 w-64 overflow-hidden rounded-lg">
                <Image
                  alt={`${user.username}'s avatar`}
                  className="object-cover"
                  fill
                  src={imageUrl}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
