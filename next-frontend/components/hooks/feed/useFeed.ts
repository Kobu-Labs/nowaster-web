/* eslint-disable perfectionist/sort-objects */

import { InfiniteData } from "@tanstack/react-query";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as FeedApi from "@/api/feedApi";
import type {
  CreateFeedReactionRequest,
  RemoveFeedReactionRequest,
} from "@/api/definitions/requests/feed";
import { FeedResponse } from "@/api/definitions/responses/feed";
import { useAuth } from "@clerk/nextjs";

export const FEED_QUERY_KEY = "feed";

export const useFeed = () => {
  return useInfiniteQuery({
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 20) {
        return undefined;
      }
      return lastPage.at(-1)!.created_at;
    },
    initialPageParam: undefined,
    queryFn: async ({ pageParam }: { pageParam: Date | undefined; }) =>
      await FeedApi.getFeed({
        cursor: pageParam,
        limit: 20,
      }),
    queryKey: [FEED_QUERY_KEY],
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddReaction = () => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (params: CreateFeedReactionRequest) => {
      return await FeedApi.addReaction(params);
    },
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: [FEED_QUERY_KEY] });
      const previousFeed = queryClient.getQueryData([FEED_QUERY_KEY]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        [FEED_QUERY_KEY],
        (old: InfiniteData<FeedResponse["getFeed"]>) => {
          if (!old?.pages) {
            return old;
          }

          return {
            ...old,
            pages: old.pages.map((page: FeedResponse["getFeed"]) => {
              return page.map((event) => {
                if (event.id === newTodo.feed_event_id) {
                  return {
                    ...event,
                    reactions: [
                      {
                        created_at: new Date(),
                        emoji: newTodo.emoji,
                        user: {
                          id: userId,
                        },
                      },
                      ...event.reactions,
                    ],
                  };
                }
                return event;
              });
            }),
          };
        },
      );

      return { previousFeed };
    },
    onError: (_err, _addedReaction, context) => {
      queryClient.setQueryData([FEED_QUERY_KEY], context?.previousFeed);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    },
  });
};

export const useRemoveReaction = () => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: (params: RemoveFeedReactionRequest) =>
      FeedApi.removeReaction(params),
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: [FEED_QUERY_KEY] });
      const previousData = queryClient.getQueryData([FEED_QUERY_KEY]);

      queryClient.setQueryData(
        [FEED_QUERY_KEY],
        (old: InfiniteData<FeedResponse["getFeed"]>) => {
          if (!old?.pages) {
            return old;
          }

          return {
            ...old,
            pages: old.pages.map((page: FeedResponse["getFeed"]) => {
              return page.map((event) => {
                if (event.id === newTodo.feed_event_id) {
                  return {
                    ...event,
                    reactions: event.reactions.filter(
                      (reaction) =>
                        reaction.emoji !== newTodo.emoji
                        || reaction.user.id !== userId,
                    ),
                  };
                }
                return event;
              });
            }),
          };
        },
      );

      return { previousData };
    },

    onError: (_err, _removedReaction, context) => {
      queryClient.setQueryData([FEED_QUERY_KEY], context?.previousData);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    },
  });
};
