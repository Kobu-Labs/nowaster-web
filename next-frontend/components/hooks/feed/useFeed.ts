import {
    useMutation,
    useInfiniteQuery,
    useQueryClient
} from "@tanstack/react-query";
import * as FeedApi from "@/api/feedApi";
import {
    RemoveFeedReactionRequest
} from "@/api/definitions/requests/feed";
import { FeedResponse } from "@/api/definitions/responses/feed";
import { useAuth } from "@clerk/nextjs";
import { Infer } from "next/dist/compiled/superstruct";

export const FEED_QUERY_KEY = "feed";

export const useFeed = () => {
  return useInfiniteQuery({
    queryKey: [FEED_QUERY_KEY],
    queryFn: async ({ pageParam }) =>
      await FeedApi.getFeed({
        cursor: pageParam,
        limit: 20,
      }),
    initialPageParam: undefined as Date | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].created_at;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAddReaction = () => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (params: Infer) => {
      return await FeedApi.addReaction(params);
    },
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: [FEED_QUERY_KEY] });
      const previousFeed = queryClient.getQueryData([FEED_QUERY_KEY]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        [FEED_QUERY_KEY],
        (old: any) => {
          if (!old?.pages) return old;
          
          return {
            ...old,
            pages: old.pages.map((page: FeedResponse["getFeed"]) => {
              return page.map((event) => {
                if (event.id === newTodo.feed_event_id) {
                  return {
                    ...event,
                    reactions: [
                      {
                        emoji: newTodo.emoji,
                        created_at: new Date(),
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
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    },
    onError: (_err, _addedReaction, context) => {
      queryClient.setQueryData([FEED_QUERY_KEY], context?.previousFeed);
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
        (old: any) => {
          if (!old?.pages) return old;
          
          return {
            ...old,
            pages: old.pages.map((page: FeedResponse["getFeed"]) => {
              return page.map((event) => {
                if (event.id === newTodo.feed_event_id) {
                  return {
                    ...event,
                    reactions: event.reactions.filter(
                      (reaction) =>
                        reaction.emoji !== newTodo.emoji ||
                        reaction.user.id !== userId,
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
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    },
    onError: (_err, _removedReaction, context) => {
      queryClient.setQueryData([FEED_QUERY_KEY], context?.previousData);
    },
  });
};
