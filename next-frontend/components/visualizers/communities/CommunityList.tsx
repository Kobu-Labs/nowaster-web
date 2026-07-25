"use client";

import { useInviteInbox } from "@/components/hooks/community/useInviteInbox";
import { useMyCommunities } from "@/components/hooks/community/useMyCommunities";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { CommunityCard } from "@/components/visualizers/communities/CommunityCard";
import { CreateCommunityDialog } from "@/components/visualizers/communities/CreateCommunityDialog";
import { InviteInbox } from "@/components/visualizers/communities/InviteInbox";
import { Compass, Users } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";

const CommunityCardSkeleton: FC = () => (
  <Card>
    <CardContent className="p-6 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
    </CardContent>
  </Card>
);

export const CommunityList: FC = () => {
  const query = useMyCommunities();
  const inboxQuery = useInviteInbox();

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communities</h1>
          <p className="text-muted-foreground">
            Track time together with people learning or working on the same
            things.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/home/communities/discover">
              <Compass className="mr-2 h-4 w-4" />
              Discover
            </Link>
          </Button>
          <CreateCommunityDialog />
        </div>
      </div>

      {!!inboxQuery.data?.length && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Pending invites</h2>
          <InviteInbox />
        </div>
      )}

      {query.isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CommunityCardSkeleton key={i} />
          ))}
        </div>
      )}

      {query.isError && (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive font-semibold">
              Error loading your communities
            </p>
            <p className="text-muted-foreground text-sm">
              Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      )}

      {query.isSuccess && query.data.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">
                  You haven&apos;t started a community yet
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Communities let you track time together with people learning
                  or working on the same things. Create one to get started.
                </p>
              </div>
              <CreateCommunityDialog />
            </div>
          </CardContent>
        </Card>
      )}

      {query.isSuccess && query.data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {query.data.map((community) => (
            <CommunityCard community={community} key={community.id} />
          ))}
        </div>
      )}
    </div>
  );
};
