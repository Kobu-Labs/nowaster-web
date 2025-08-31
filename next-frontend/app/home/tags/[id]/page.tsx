"use client";

import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { FilteredSessionAreaChart } from "@/components/visualizers/sessions/charts/FilteredSessionAreaChart";
import { SessionAverageDurationProvider } from "@/components/visualizers/sessions/kpi/SessionAverageDurationCard";
import { SessionCountCard } from "@/components/visualizers/sessions/kpi/SessionCountCard";
import { TotalSessionTimeCard } from "@/components/visualizers/sessions/kpi/TotalSessionTimeCard";
import { FilterContextProvider } from "@/components/visualizers/sessions/SessionFilterContextProvider";
import { BaseSessionTableColumns } from "@/components/visualizers/sessions/table/BaseSessionColumns";
import { BaseSessionTable } from "@/components/visualizers/sessions/table/BaseSessionTable";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/shadcn/alert";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import type { SessionFilterPrecursor } from "@/state/chart-filter";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";

export default function Page(props: { params: Promise<{ id: string; }>; }) {
  const params = use(props.params);
  const tagQuery = useQuery(queryKeys.tags.byId(params.id));

  if (tagQuery.isLoading) {
    return <TagDetailSkeleton />;
  }

  if (tagQuery.isError || !tagQuery.data) {
    return <TagNotFoundError onRetry={() => tagQuery.refetch()} />;
  }

  const tag = tagQuery.data;

  const filter: SessionFilterPrecursor = {
    data: {
      tags: [tag],
    },
    settings: {
      tags: {
        id: {
          mode: "all",
        },
      },
    },
  };

  return (
    <div className="grow">
      <div className="my-8 pl-8 ">
        <h2 className="flex items-center gap-4 text-3xl font-bold tracking-tight">
          Details page for
          <TagBadge tag={tag} variant="auto" />
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <TotalSessionTimeCard filter={filter} />
        <SessionAverageDurationProvider filter={filter} />
        <SessionCountCard filter={filter} />

        <FilterContextProvider initialFilter={filter}>
          <FilteredSessionAreaChart
            className="col-span-full h-[400px]"
            initialGranularity="days-in-month"
          />
          <div className="col-span-full">
            <BaseSessionTable
              columns={BaseSessionTableColumns}
              filter={filter}
            />
          </div>
        </FilterContextProvider>
      </div>
    </div>
  );
}

function TagDetailSkeleton() {
  return (
    <div className="grow">
      <div className="my-8 pl-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-8 w-20" />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-4 w-28 mb-2" />
          <Skeleton className="h-8 w-12" />
        </Card>
        <Card className="col-span-full h-[400px] p-6">
          <Skeleton className="h-full w-full" />
        </Card>
        <Card className="col-span-full p-6">
          <Skeleton className="h-8 w-full mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function TagNotFoundError({ onRetry }: { onRetry: () => void; }) {
  const router = useRouter();

  return (
    <div className="flex justify-center items-center min-h-96">
      <Alert className="max-w-md" variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Tag Not Found</AlertTitle>
        <AlertDescription className="mt-2">
          The tag you&apos;re looking for doesn&apos;t exist or you don&apos;t
          have access to it.
        </AlertDescription>
        <div className="flex gap-2 mt-4">
          <Button onClick={onRetry} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button
            onClick={() => { router.push("/home/tags"); }}
            size="sm"
            variant="outline"
          >
            Back to Tags
          </Button>
        </div>
      </Alert>
    </div>
  );
}
