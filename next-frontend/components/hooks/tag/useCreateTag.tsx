import { TagApi } from "@/api";
import { TagDetails, TagRequest } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { tagColors } from "@/state/tags";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetRecoilState } from "recoil";

export const useCreateTag = ({
  onSuccess,
}: {
  onSuccess?: (val: TagDetails) => void;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setColors = useSetRecoilState(tagColors);

  const toastError = (message: string) => {
    toast({
      title: "Error creating tag",
      description: message,
      variant: "destructive",
    });
  };

  const mutation = useMutation({
    mutationFn: async (data: TagRequest["create"]) => {
      return await TagApi.create(data);
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags._def });

      if (data.isErr) {
        toastError(data.error.message);
        return;
      }

      setColors((prev) => ({
        ...prev,
        [data.value.label]: data.value.color,
      }));

      toast({
        description: (
          <div className="flex items-center gap-2">
            <TagBadge tag={data.value} variant="auto" />
            created successfully!
          </div>
        ),
        variant: "default",
      });

      if (onSuccess) {
        onSuccess(data.value);
      }
    },
  });

  return mutation;
};
