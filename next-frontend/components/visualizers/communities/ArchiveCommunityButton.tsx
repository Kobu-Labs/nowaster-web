"use client";

import { useArchiveCommunity } from "@/components/hooks/community/useArchiveCommunity";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcn/alert-dialog";
import { Button } from "@/components/shadcn/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FC } from "react";
import { useState } from "react";

type ArchiveCommunityButtonProps = {
  communityId: string;
};

export const ArchiveCommunityButton: FC<ArchiveCommunityButtonProps> = ({
  communityId,
}) => {
  const [open, setOpen] = useState(false);
  const archiveCommunity = useArchiveCommunity();
  const router = useRouter();

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <Button className="flex items-center gap-2" variant="destructive">
          <Trash2 className="h-4 w-4" />
          Archive Community
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive this community?</AlertDialogTitle>
          <AlertDialogDescription>
            This hides the community from members&apos; community switching
            and cannot be undone from the UI.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              archiveCommunity.mutate(
                { id: communityId },
                {
                  onSuccess: () => {
                    router.push("/home/communities");
                  },
                },
              );
            }}
          >
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
