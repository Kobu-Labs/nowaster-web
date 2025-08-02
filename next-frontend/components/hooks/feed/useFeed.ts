import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as FeedApi from "@/api/feedApi";
import { ReadFeedEvent } from "@/api/definitions/models/feed";
import { CreateFeedReactionRequest, RemoveFeedReactionRequest } from "@/api/definitions/requests/feed";

export const FEED_QUERY_KEY = "feed";

export const useFeed = () => {
  return useInfiniteQuery({
    queryKey: [FEED_QUERY_KEY],
    queryFn: ({ pageParam }) => 
      FeedApi.getFeed({ 
        cursor: pageParam, 
        limit: 20 
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      
      // Get the oldest item's created_at as the next cursor
      const oldestItem = lastPage[lastPage.length - 1];
      return oldestItem?.created_at;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAddReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateFeedReactionRequest) => FeedApi.addReaction(params),
    onSuccess: (_, variables) => {
      // Optimistically update the query data
      queryClient.setQueryData([FEED_QUERY_KEY], (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: ReadFeedEvent[]) =>
            page.map((event) =>
              event.id === variables.feed_event_id
                ? {
                    ...event,
                    user_reaction: variables.emoji,
                    // Note: We don't add to reactions array here as we don't have user info
                    // The backend should handle this and a refetch would show the complete data
                  }
                : event
            )
          ),
        };
      });
    },
  });
};

export const useRemoveReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: RemoveFeedReactionRequest) => FeedApi.removeReaction(params),
    onSuccess: (_, variables) => {
      // Optimistically update the query data
      queryClient.setQueryData([FEED_QUERY_KEY], (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: ReadFeedEvent[]) =>
            page.map((event) =>
              event.id === variables.feed_event_id
                ? {
                    ...event,
                    user_reaction: event.user_reaction === variables.emoji ? null : event.user_reaction,
                    reactions: event.reactions.filter(
                      (reaction) => !(reaction.emoji === variables.emoji && reaction.user.id === event.user.id)
                    ),
                  }
                : event
            )
          ),
        };
      });
    },
  });
};