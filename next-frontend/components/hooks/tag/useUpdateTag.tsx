import { TagApi } from "@/api";
import { TagRequest } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { tagColors } from "@/state/tags";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetRecoilState } from "recoil";

export const useUpdateTag = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setColors = useSetRecoilState(tagColors);

  const toastError = (message: string) => {
    toast({
      title: "Error updating tag",
      description: message,
      variant: "destructive",
    });
  };

  const mutation = useMutation({
    mutationFn: async (data: TagRequest["update"]) => {
      const result = await TagApi.update(data);
      if (result.isErr) {
        throw new Error(result.error.message);
      }
      return result.value;
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
            updated successfully!
          </div>
        ),
        variant: "default",
      });
    },
    onError: (error) => toastError(error.message),
  });

  return mutation;
};
