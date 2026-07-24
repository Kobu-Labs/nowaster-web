"use client";

import type { CommunityInvite, CommunityInviteStatus } from "@/api/definitions";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { useCommunityInvites } from "@/components/hooks/community/useCommunityInvites";
import { useRevokeInvite } from "@/components/hooks/community/useRevokeInvite";
import { format } from "date-fns";
import {
  Ban,
  Check,
  Clock,
  HourglassIcon,
  X,
} from "lucide-react";
import type { FC } from "react";

type InviteManagementListProps = {
  communityId: string;
};

const STATUS_META: Record<CommunityInviteStatus, { icon: FC<{ className?: string; }>; label: string; }> = {
  accepted: { icon: Check, label: "Accepted" },
  declined: { icon: X, label: "Declined" },
  expired: { icon: HourglassIcon, label: "Expired" },
  pending: { icon: Clock, label: "Pending" },
  revoked: { icon: Ban, label: "Revoked" },
};

export const InviteManagementList: FC<InviteManagementListProps> = ({ communityId }) => {
  const query = useCommunityInvites(communityId);
  const revokeInvite = useRevokeInvite(communityId);

  if (query.isPending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
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
      <p className="text-sm text-muted-foreground">
        No invites yet — invite a specific person or share a link.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invite</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {query.data.map((invite: CommunityInvite) => {
          const meta = STATUS_META[invite.status];
          const Icon = meta.icon;
          return (
            <TableRow key={invite.id}>
              <TableCell>
                {invite.invite_type === "direct"
                  ? (invite.invited_user?.username ?? "Unknown user")
                  : `Link · ${invite.code}`}
              </TableCell>
              <TableCell>
                <Badge className="gap-1" variant="outline">
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(invite.created_at, "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                {invite.status === "pending" && (
                  <Button
                    disabled={revokeInvite.isPending}
                    onClick={() => revokeInvite.mutate(invite.id)}
                    size="sm"
                    variant="outline"
                  >
                    Revoke
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
