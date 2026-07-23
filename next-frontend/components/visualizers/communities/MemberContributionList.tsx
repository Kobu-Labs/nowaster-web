"use client";

import type { MemberContribution } from "@/api/definitions";
import { useAuth } from "@/components/hooks/useAuth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Card, CardContent } from "@/components/shadcn/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { formatMinutesAsDuration } from "@/components/visualizers/communities/formatMinutes";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { FC } from "react";

type MemberContributionListProps = {
  members: MemberContribution[];
};

export const MemberContributionList: FC<MemberContributionListProps> = ({
  members,
}) => {
  const { user } = useAuth();

  return (
    <>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Sessions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const isViewer = member.user.id === user?.id;
              return (
                <TableRow
                  className={cn(isViewer && "bg-accent/50")}
                  key={member.user.id}
                >
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
                        {isViewer && " (You)"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatMinutesAsDuration(member.total_minutes)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.session_count}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2 sm:hidden">
        {members.map((member) => {
          const isViewer = member.user.id === user?.id;
          return (
            <Card className={cn(isViewer && "bg-accent/50")} key={member.user.id}>
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
                  <p className="truncate font-medium">
                    {member.user.username}
                    {isViewer && " (You)"}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>{formatMinutesAsDuration(member.total_minutes)}</p>
                  <p className="text-muted-foreground">
                    {member.session_count}
                    {" "}
                    sessions
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};
