"use client";

import { useAvatar } from "@/components/hooks/avatar/useAvatar";
import { useLatestRun } from "@/components/hooks/avatar/useLatestRun";
import { AvatarDialog } from "@/components/ui-providers/avatar/AvatarDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn/avatar";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { type FC, useState } from "react";

type Props = {
  avatarClassName?: string;
  className?: string;
  username: string;
};

export const UserAvatarThumb: FC<Props> = ({
  username,
  className,
  avatarClassName,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: avatar } = useAvatar();
  const { data: latestRun } = useLatestRun();

  const thumbUrl = avatar?.isEnabled ? avatar.currentThumbUrl : null;
  const imageUrl = avatar?.isEnabled ? avatar.currentImageUrl : null;
  const hasImage = !!thumbUrl && !!imageUrl;

  return (
    <>
      <button
        aria-label="View avatar"
        className={cn(
          "rounded-full ring-offset-background transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          hasImage ? "cursor-pointer" : "cursor-default",
          className,
        )}
        disabled={!hasImage}
        onClick={() => hasImage && setDialogOpen(true)}
        onMouseEnter={() => {
          if (imageUrl) {
            const img = new window.Image();
            img.src = imageUrl;
          }
        }}
        type="button"
      >
        <Avatar className={cn("h-10 w-10", avatarClassName)}>
          {thumbUrl && <AvatarImage alt={username} src={thumbUrl} />}
          <AvatarFallback className="bg-primary/10 text-sm font-medium">
            {getInitials(username)}
          </AvatarFallback>
        </Avatar>
      </button>

      {imageUrl && (
        <AvatarDialog
          imageUrl={imageUrl}
          latestRun={latestRun ?? null}
          onOpenChange={setDialogOpen}
          open={dialogOpen}
          username={username}
        />
      )}
    </>
  );
};
