"use client";

import type { FC } from "react";
import { useCallback, useEffect, useRef } from "react";
import { useFeed } from "@/components/hooks/feed/useFeed";
import { Loader2 } from "lucide-react";
import { SessionCompletedFeedCard } from "@/components/visualizers/feed/events/SessionCompletedEventCard";
import { TaskCompletedFeedCard } from "@/components/visualizers/feed/events/TaskCompletedEventCard";
import { ProjectCompletedFeedCard } from "@/components/visualizers/feed/events/ProjectCompletedEventCard";
import type { ReadFeedEvent } from "@/api/definitions/models/feed";

export const Feed: FC = () => {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useFeed();

  const observer = useRef<IntersectionObserver | null>(null);
  const lastEventElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isFetchingNextPage) {
        return;
      }
      if (observer.current) {
        observer.current.disconnect();
      }
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasNextPage) {
          void fetchNextPage();
        }
      });
      if (node) {
        observer.current.observe(node);
      }
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  useEffect(() => {
    return () => observer.current?.disconnect();
  }, []);

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
        Error loading feed:
        {error.message}
      </div>
    );
  }

  const allEvents = data?.pages.flat() ?? [];

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

  const renderEventCard = (event: ReadFeedEvent) => {
    switch (event.event_type) {
      case "session_completed": {
        switch (event.source_type) {
          case "placeholder": {
            return null;
          }
          case "user": {
            return (
              <SessionCompletedFeedCard
                event={event}
                event_data={event.event_data}
                user={event.source_data}
              />
            );
          }
        }
      }
      case "task_completed": {
        switch (event.source_type) {
          case "placeholder": {
            return null;
          }
          case "user": {
            return (
              <TaskCompletedFeedCard
                event={event}
                event_data={event.event_data}
                user={event.source_data}
              />
            );
          }
        }
      }
      case "project_completed": {
        switch (event.source_type) {
          case "placeholder": {
            return null;
          }
          case "user": {
            return (
              <ProjectCompletedFeedCard
                event={event}
                event_data={event.event_data}
                user={event.source_data}
              />
            );
          }
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      {allEvents.map((event, index) => {
        return (
          <div
            key={event.id}
            ref={
              index === allEvents.length - 3 ? lastEventElementRef : undefined
            }
          >
            {renderEventCard(event)}
          </div>
        );
      })}

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {!hasNextPage && allEvents.length > 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          You&apos;ve reached the end of the feed
        </div>
      )}
    </div>
  );
};
