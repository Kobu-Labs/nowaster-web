"use client";

import { useJoinCommunity } from "@/components/hooks/community/useJoinCommunity";
import { Button } from "@/components/shadcn/button";
import { UserPlus } from "lucide-react";
import type { FC } from "react";

type JoinCommunityButtonProps = {
  communityId: string;
};

export const JoinCommunityButton: FC<JoinCommunityButtonProps> = ({
  communityId,
}) => {
  const joinCommunity = useJoinCommunity();

  return (
    <Button
      className="flex items-center gap-2"
      disabled={joinCommunity.isPending}
      loading={joinCommunity.isPending}
      onClick={() => joinCommunity.mutate({ communityId })}
    >
      <UserPlus className="h-4 w-4" />
      Join Community
    </Button>
  );
};
