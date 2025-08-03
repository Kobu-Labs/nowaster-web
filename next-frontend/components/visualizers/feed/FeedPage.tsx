"use client";

import { FC, useEffect, useRef, useCallback } from "react";
import { useFeed } from "@/components/hooks/feed/useFeed";
import { SessionFeedCard } from "./SessionFeedCard";
import { Loader2 } from "lucide-react";

export const FeedPage: FC = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useFeed();

  const observer = useRef<IntersectionObserver>();
  const lastEventElementRef = useCallback((node: HTMLDivElement) => {
    if (isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) observer.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading feed: {error.message}
      </div>
    );
  }

  const allEvents = data?.pages.flat() || [];

  if (allEvents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No feed events yet.</p>
        <p className="text-sm mt-2">
          Follow some friends or start some sessions to see activity here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="text-2xl font-bold">Feed</div>
      <div className="space-y-4">
        {allEvents.map((event, index) => {
          if (index === allEvents.length - 3) {
            return (
              <div key={event.id} ref={lastEventElementRef}>
                <SessionFeedCard event={event} />
              </div>
            );
          }
          return <SessionFeedCard key={event.id} event={event} />;
        })}
        
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        
        {!hasNextPage && allEvents.length > 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            You've reached the end of the feed
          </div>
        )}
      </div>
    </div>
  );
};