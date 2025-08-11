import { ScheduledSessionApi, StopwatchApi } from "@/api";
import {
  ScheduledSessionRequest,
  StopwatchSessionRequest,
} from "@/api/definitions";
import {
  CategoryWithId,
  ScheduledSessionWithIdSchema,
  StopwatchSessionWithIdSchema,
  TagWithId,
} from "@/api/definitions/models";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

type ActiveSession =
  | z.infer<typeof ScheduledSessionWithIdSchema>
  | z.infer<typeof StopwatchSessionWithIdSchema>;

export function useUpdateSession(
  sessionType: "stopwatch",
): ReturnType<typeof useUpdateStopwatchSession>;
export function useUpdateSession(
  sessionType: "scheduled",
): ReturnType<typeof useUpdateScheduledSession>;

export function useUpdateSession(sessionType: "stopwatch" | "scheduled") {
  const updateStopwatch = useUpdateStopwatchSession();
  const updateScheduled = useUpdateScheduledSession();

  if (sessionType === "stopwatch") {
    return updateStopwatch;
  }
  if (sessionType === "scheduled") {
    return updateScheduled;
  }

  throw new Error("Invalid session type");
}

const useUpdateStopwatchSession = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateSessionMutation = useMutation({
    mutationFn: async (data: StopwatchSessionRequest["update"]) => {
      return await StopwatchApi.update(data);
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.sessions.active.queryKey,
      });

      const previousActiveSessions = queryClient.getQueryData(
        queryKeys.sessions.active.queryKey,
      );

      const tags: TagWithId[] =
        queryClient.getQueryData(queryKeys.tags.all.queryKey) ?? [];

      const categories: CategoryWithId[] =
        queryClient.getQueryData(queryKeys.categories.all.queryKey) ?? [];

      let newCategories = undefined;
      if (newData.category_id !== undefined) {
        newCategories = categories.find(
          (cat) => cat.id === newData.category_id,
        );
      }

      let newTags = undefined;
      if (newData.tag_ids !== undefined && newData !== null) {
        newTags = tags.filter((tag) => newData.tag_ids?.includes(tag.id));
      }

      queryClient.setQueryData(
        queryKeys.sessions.active.queryKey,
        (old: ActiveSession[] | undefined) => {
          if (!old) {
            return undefined;
          }

          return old.map((session) => {
            if (session.id === newData.id) {
              const sessionTags = newTags ?? session.tags;
              const sessionCategory = newCategories ?? session.category;
              return {
                ...session,
                ...newData,
                tags: sessionTags,
                category: sessionCategory,
              };
            }
            return session;
          });
        },
      );

      return { previousActiveSessions };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.active.queryKey,
      });
      toast({
        description: `Session updated successfully!`,
        variant: "default",
      });
    },
    onError: (error, _, context) => {
      if (context?.previousActiveSessions) {
        queryClient.setQueryData(
          queryKeys.sessions.active.queryKey,
          context.previousActiveSessions,
        );
      }
      toast({
        title: "Error updating session",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.active.queryKey,
      });
    },
  });
  return updateSessionMutation;
};

const useUpdateScheduledSession = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateSessionMutation = useMutation({
    mutationFn: async (data: ScheduledSessionRequest["update"]) => {
      return await ScheduledSessionApi.update(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.sessions._def,
      });
      toast({
        description: `Session updated successfully!`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating session",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  return updateSessionMutation;
};
