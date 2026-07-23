"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Separator } from "@/components/shadcn/separator";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useAuth } from "@/components/hooks/useAuth";
import { useCommunityById } from "@/components/hooks/community/useCommunityById";
import { useCommunityMembers } from "@/components/hooks/community/useCommunityMembers";
import { ArchiveCommunityButton } from "@/components/visualizers/communities/ArchiveCommunityButton";
import { EditCommunitySettingsForm } from "@/components/visualizers/communities/EditCommunitySettingsForm";
import { InviteCodeCard } from "@/components/visualizers/communities/InviteCodeCard";
import { JoinCommunityButton } from "@/components/visualizers/communities/JoinCommunityButton";
import { MemberList } from "@/components/visualizers/communities/MemberList";
import { getInitials } from "@/lib/utils";
import { Edit, Globe, Lock } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";

type CommunityDetailPageProps = {
  id: string;
};

export const CommunityDetailPage: FC<CommunityDetailPageProps> = ({ id }) => {
  const query = useCommunityById(id);
  const membersQuery = useCommunityMembers(id);
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);

  if (query.isPending) {
    return (
      <div className="w-full p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="w-full p-6">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive font-semibold">
              Community not found
            </p>
            <p className="text-muted-foreground text-sm">
              {query.error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const community = query.data;

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex flex-col items-center text-center gap-4 sm:flex-row sm:items-center sm:text-left">
        <Avatar className="h-16 w-16">
          <AvatarImage
            alt={community.name}
            src={community.avatar_url ?? undefined}
          />
          <AvatarFallback className="text-xl">
            {getInitials(community.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              {community.name}
            </h1>
            {community.is_owner && <Badge variant="secondary">Owner</Badge>}
            <Badge className="flex items-center gap-1" variant="outline">
              {community.visibility_type === "public"
                ? (
                    <>
                      <Globe className="h-3 w-3" />
                      Public
                    </>
                  )
                : (
                    <>
                      <Lock className="h-3 w-3" />
                      Invite only
                    </>
                  )}
            </Badge>
          </div>
          {community.description && (
            <p className="text-muted-foreground mt-1">
              {community.description}
            </p>
          )}
        </div>
        {community.is_owner && (
          <Button
            aria-expanded={editing}
            className="flex items-center gap-2"
            onClick={() => setEditing((prev) => !prev)}
            variant="outline"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}
        {!community.is_owner
          && community.visibility_type === "public"
          && membersQuery.isSuccess
          && !membersQuery.data.some((member) => member.user.id === user?.id) && (
          <JoinCommunityButton communityId={community.id} />
        )}
      </div>

      {community.is_owner && editing && (
        <Card>
          <CardContent className="p-6">
            <EditCommunitySettingsForm
              community={community}
              onSaved={() => setEditing(false)}
            />
          </CardContent>
        </Card>
      )}

      {community.is_owner && community.visibility_type === "invite_only" && (
        <InviteCodeCard communityId={community.id} />
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Members</h2>
        <MemberList communityId={community.id} />
      </div>

      {community.is_owner && (
        <>
          <Separator />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-destructive">
              Danger zone
            </h2>
            <ArchiveCommunityButton communityId={community.id} />
          </div>
        </>
      )}
    </div>
  );
};
