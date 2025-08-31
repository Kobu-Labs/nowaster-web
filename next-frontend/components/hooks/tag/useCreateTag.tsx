import { TagApi } from "@/api";
import type { TagRequest } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { tagColors } from "@/state/tags";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

export const useCreateTag = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setColors = useSetAtom(tagColors);

  const mutation = useMutation({
    mutationFn: async (data: TagRequest["create"]) => {
      return await TagApi.create(data);
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags._def });

      setColors((prev) => ({
        ...prev,
        [data.label]: data.color,
      }));

      toast({
        description: (
          <div className="flex items-center gap-2">
            <TagBadge tag={data} variant="auto" />
            created successfully!
          </div>
        ),
        variant: "default",
      });
    },
  });

  return mutation;
};
