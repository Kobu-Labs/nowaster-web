"use client";

import { useLeaveCommunity } from "@/components/hooks/community/useLeaveCommunity";
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
import { LogOut } from "lucide-react";
import type { FC } from "react";

type LeaveCommunityButtonProps = {
  communityId: string;
};

export const LeaveCommunityButton: FC<LeaveCommunityButtonProps> = ({
  communityId,
}) => {
  const leaveCommunity = useLeaveCommunity();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <LogOut className="h-4 w-4" />
          Leave
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave this community?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll need a new invite (or the community must be public) to
            join again later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              leaveCommunity.mutate({ communityId });
            }}
          >
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
