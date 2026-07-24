"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { useInviteInbox } from "@/components/hooks/community/useInviteInbox";
import { useRespondToInvite } from "@/components/hooks/community/useRespondToInvite";
import { getInitials } from "@/lib/utils";
import { Check, Mail, X } from "lucide-react";

export const InviteInbox = () => {
  const query = useInviteInbox();
  const respond = useRespondToInvite();

  if (query.isPending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <p className="text-sm text-destructive">
        Couldn&apos;t load invites:
        {" "}
        {query.error.message}
      </p>
    );
  }

  if (query.data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mail className="mx-auto h-8 w-8 mb-2" />
        <p className="text-sm">
          No pending invites. When someone invites you to a community, it&apos;ll
          show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {query.data.map((invite) => (
        <Card key={invite.id}>
          <CardContent className="p-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar>
                <AvatarImage
                  alt={invite.community_name}
                  src={invite.created_by.avatarThumbUrl ?? undefined}
                />
                <AvatarFallback>{getInitials(invite.community_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium truncate">{invite.community_name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  Invited by
                  {" "}
                  {invite.created_by.username}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                aria-label={`Accept invite to ${invite.community_name}`}
                disabled={respond.isPending}
                onClick={() => respond.mutate({ accept: true, inviteId: invite.id })}
                size="icon"
                variant="outline"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                aria-label={`Decline invite to ${invite.community_name}`}
                disabled={respond.isPending}
                onClick={() => respond.mutate({ accept: false, inviteId: invite.id })}
                size="icon"
                variant="outline"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
