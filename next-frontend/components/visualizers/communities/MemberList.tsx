"use client";

import { useAuth } from "@/components/hooks/useAuth";
import { useCommunityMembers } from "@/components/hooks/community/useCommunityMembers";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Card, CardContent } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { LeaveCommunityButton } from "@/components/visualizers/communities/LeaveCommunityButton";
import { getInitials } from "@/lib/utils";
import { format } from "date-fns";
import type { FC } from "react";

type MemberListProps = {
  communityId: string;
};

export const MemberList: FC<MemberListProps> = ({ communityId }) => {
  const query = useCommunityMembers(communityId);
  const { user } = useAuth();

  if (query.isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="flex items-center gap-3" key={i}>
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <p className="text-sm text-destructive">
        Couldn&apos;t load members:
        {" "}
        {query.error.message}
      </p>
    );
  }

  const members = query.data;

  return (
    <>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        alt={member.user.username}
                        src={member.user.avatar_url ?? undefined}
                      />
                      <AvatarFallback>
                        {getInitials(member.user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {member.user.username}
                      {member.user.id === user?.id && " (You)"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={member.role === "owner" ? "secondary" : "outline"}>
                    {member.role === "owner" ? "Owner" : "Member"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(member.joined_at, "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  {member.user.id === user?.id && member.role !== "owner" && (
                    <LeaveCommunityButton communityId={communityId} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2 sm:hidden">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    alt={member.user.username}
                    src={member.user.avatar_url ?? undefined}
                  />
                  <AvatarFallback>
                    {getInitials(member.user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {member.user.username}
                    {member.user.id === user?.id && " (You)"}
                  </p>
                  <Badge variant={member.role === "owner" ? "secondary" : "outline"}>
                    {member.role === "owner" ? "Owner" : "Member"}
                  </Badge>
                </div>
              </div>
              {member.user.id === user?.id && member.role !== "owner" && (
                <LeaveCommunityButton communityId={communityId} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};
