"use client";

import type { CommunitySearchResult } from "@/api/definitions";
import { useJoinCommunity } from "@/components/hooks/community/useJoinCommunity";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { formatMinutesAsDuration } from "@/components/visualizers/communities/formatMinutes";
import { getInitials } from "@/lib/utils";
import { Users } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";

type DiscoveryResultCardProps = {
  community: CommunitySearchResult;
};

export const DiscoveryResultCard: FC<DiscoveryResultCardProps> = ({ community }) => {
  const joinCommunity = useJoinCommunity();

  return (
    <Card className="group backdrop-blur-md bg-gray-900/80 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg h-full flex flex-col">
      <CardContent className="p-6 flex flex-col flex-1">
        <Link className="flex items-start gap-3 mb-4" href={`/home/communities/${community.id}`}>
          <Avatar>
            <AvatarImage
              alt={community.name}
              src={community.avatar_url ?? undefined}
            />
            <AvatarFallback>{getInitials(community.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <h3 className="font-semibold text-lg truncate">{community.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="w-fit flex items-center gap-1" variant="outline">
                <Users className="h-3 w-3" />
                {community.member_count}
                {" "}
                members
              </Badge>
              {community.recent_activity_minutes > 0 && (
                <Badge className="w-fit" variant="secondary">
                  {formatMinutesAsDuration(community.recent_activity_minutes)}
                  {" "}
                  this month
                </Badge>
              )}
            </div>
          </div>
        </Link>

        {community.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {community.description}
          </p>
        )}

        <div className="grow" />

        {community.is_member
          ? (
              <Button asChild className="w-full" size="sm" variant="secondary">
                <Link href={`/home/communities/${community.id}`}>View community</Link>
              </Button>
            )
          : (
              <Button
                className="w-full"
                loading={joinCommunity.isPending}
                onClick={() => joinCommunity.mutate({ communityId: community.id })}
                size="sm"
              >
                Join
              </Button>
            )}
      </CardContent>
    </Card>
  );
};
