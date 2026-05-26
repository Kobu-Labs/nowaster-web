"use client";

import { useAvatar } from "@/components/hooks/avatar/useAvatar";
import { useLatestRun } from "@/components/hooks/avatar/useLatestRun";
import { AvatarDialog } from "@/components/ui-providers/avatar/AvatarDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn/avatar";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { type FC, useState } from "react";

type Props = {
  username: string;
  className?: string;
};

export const UserAvatarThumb: FC<Props> = ({ username, className }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: avatar } = useAvatar();
  const { data: latestRun } = useLatestRun();

  const thumbUrl = avatar?.isEnabled ? avatar.currentThumbUrl : null;
  const hasImage = !!thumbUrl;

  return (
    <>
      <button
        aria-label="View avatar"
        className={cn(
          "rounded-full ring-offset-background transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          !hasImage && "cursor-default",
          className,
        )}
        disabled={!hasImage}
        onClick={() => hasImage && setDialogOpen(true)}
        onMouseEnter={() => {
          if (avatar?.currentImageUrl) {
            const img = new window.Image();
            img.src = avatar.currentImageUrl;
          }
        }}
        type="button"
      >
        <Avatar className="h-10 w-10">
          {thumbUrl && <AvatarImage alt={username} src={thumbUrl} />}
          <AvatarFallback className="bg-primary/10 text-sm font-medium">
            {getInitials(username)}
          </AvatarFallback>
        </Avatar>
      </button>

      {avatar && (
        <AvatarDialog
          avatar={avatar}
          latestRun={latestRun ?? null}
          onOpenChange={setDialogOpen}
          open={dialogOpen}
          username={username}
        />
      )}
    </>
  );
};
