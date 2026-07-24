"use client";

import { useCommunityDashboard } from "@/components/hooks/community/useCommunityDashboard";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { CategoryBreakdownList } from "@/components/visualizers/communities/CategoryBreakdownList";
import { DashboardStatCards } from "@/components/visualizers/communities/DashboardStatCards";
import { MemberContributionList } from "@/components/visualizers/communities/MemberContributionList";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { BarChart3, RefreshCw } from "lucide-react";
import type { FC } from "react";

type CommunityDashboardProps = {
  communityId: string;
  isOwner: boolean;
};

export const CommunityDashboard: FC<CommunityDashboardProps> = ({
  communityId,
  isOwner,
}) => {
  const query = useCommunityDashboard(communityId);
  const queryClient = useQueryClient();

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton className="h-10 w-full" key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 space-y-3">
          <p className="font-semibold text-destructive">
            Couldn&apos;t load the dashboard
          </p>
          <p className="text-muted-foreground text-sm">{query.error.message}</p>
          <Button onClick={() => query.refetch()} size="sm" variant="outline">
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const dashboard = query.data;

  if (dashboard.categories.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent className="space-y-3">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="font-semibold">
            Set up tracked categories to start seeing community stats
          </p>
          {isOwner && (
            <p className="text-muted-foreground text-sm">
              Head to the Categories tab to add your first one.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Last updated
          {" "}
          {formatDistanceToNow(dashboard.generated_at, { addSuffix: true })}
        </p>
        <Button
          onClick={async () => {
            await queryClient.invalidateQueries({
              queryKey: queryKeys.communities.dashboard(communityId).queryKey,
            });
          }}
          size="sm"
          variant="outline"
        >
          <RefreshCw className={query.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </Button>
      </div>

      <DashboardStatCards dashboard={dashboard} />

      {dashboard.total_minutes === 0 && (
        <Card className="text-center py-8">
          <CardContent className="space-y-2">
            <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">No time logged yet</p>
            <p className="text-muted-foreground text-sm">
              Once members map their categories and log sessions, this
              dashboard fills in automatically.
            </p>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="mb-3 font-semibold">Category Breakdown</h3>
        <CategoryBreakdownList categories={dashboard.categories} />
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Member Contributions</h3>
        {dashboard.members.length < dashboard.member_count && (
          <p className="mb-2 text-sm text-muted-foreground">
            Top
            {" "}
            {dashboard.members.length}
            {" "}
            of
            {" "}
            {dashboard.member_count}
            {" "}
            members by tracked time — see the Members tab for everyone.
          </p>
        )}
        <MemberContributionList members={dashboard.members} />
      </div>
    </div>
  );
};
