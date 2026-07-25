"use client";

import type { DiscoverySort } from "@/api/definitions";
import { useDiscoverCommunities } from "@/components/hooks/community/useDiscoverCommunities";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Skeleton } from "@/components/shadcn/skeleton";
import { CategoryFilterCombobox } from "@/components/visualizers/communities/CategoryFilterCombobox";
import { CommunitySearchBar } from "@/components/visualizers/communities/CommunitySearchBar";
import { CommunitySortSelect } from "@/components/visualizers/communities/CommunitySortSelect";
import { DiscoveryResultCard } from "@/components/visualizers/communities/DiscoveryResultCard";
import { Compass } from "lucide-react";
import type { FC } from "react";
import { useEffect, useState } from "react";

const PAGE_SIZE = 20;

const DiscoveryResultCardSkeleton: FC = () => (
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
      <Skeleton className="h-8 w-full" />
    </CardContent>
  </Card>
);

export const CommunityDiscoveryPage: FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<DiscoverySort>("members");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const query = useDiscoverCommunities({
    category,
    limit: PAGE_SIZE,
    offset,
    query: debouncedSearchTerm || undefined,
    sort,
  });

  const totalCount = query.data?.total_count ?? 0;
  const hasNextPage = offset + PAGE_SIZE < totalCount;
  const hasPreviousPage = offset > 0;

  return (
    <div className="w-full p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Discover communities</h1>
        <p className="text-muted-foreground">
          Find public communities to track time together with people learning
          or working on the same things.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <CommunitySearchBar onValueChange={setSearchTerm} value={searchTerm} />
        <CategoryFilterCombobox
          onValueChange={(value) => {
            setCategory(value);
            setOffset(0);
          }}
          value={category}
        />
        <CommunitySortSelect
          onValueChange={(value) => {
            setSort(value);
            setOffset(0);
          }}
          value={sort}
        />
      </div>

      {query.isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <DiscoveryResultCardSkeleton key={i} />
          ))}
        </div>
      )}

      {query.isError && (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive font-semibold">
              Error loading communities
            </p>
            <p className="text-muted-foreground text-sm">
              Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      )}

      {query.isSuccess && query.data.results.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <Compass className="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No communities found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Try a different search term or clear the category filter.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {query.isSuccess && query.data.results.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {query.data.results.map((community) => (
              <DiscoveryResultCard community={community} key={community.id} />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button
              disabled={!hasPreviousPage}
              onClick={() => setOffset((prev) => Math.max(prev - PAGE_SIZE, 0))}
              variant="outline"
            >
              Previous
            </Button>
            <p className="text-sm text-muted-foreground">
              {offset + 1}
              -
              {Math.min(offset + PAGE_SIZE, totalCount)}
              {" "}
              of
              {" "}
              {totalCount}
            </p>
            <Button
              disabled={!hasNextPage}
              onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
