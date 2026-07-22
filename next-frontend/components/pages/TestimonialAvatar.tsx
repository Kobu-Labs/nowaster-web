"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { AvatarDialog } from "@/components/ui-providers/avatar/AvatarDialog";
import { type FC, useState } from "react";

type Props = {
  avatarFile: string;
  fallback: string;
  name: string;
};

export const TestimonialAvatar: FC<Props> = ({
  avatarFile,
  fallback,
  name,
}) => {
  const [open, setOpen] = useState(false);
  const thumbFile = avatarFile.replace(/\.jpg$/, "-thumb.jpg");

  return (
    <>
      <button
        aria-label={`View ${name}'s avatar`}
        className="cursor-pointer rounded-full transition-transform hover:scale-105"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Avatar>
          <AvatarImage alt={`${name}'s avatar`} src={`/avatars/${thumbFile}`} />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      </button>

      <AvatarDialog
        imageUrl={`/avatars/${avatarFile}`}
        onOpenChange={setOpen}
        open={open}
        username={name}
      />
    </>
  );
};
