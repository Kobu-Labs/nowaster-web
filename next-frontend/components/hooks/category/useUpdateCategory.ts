import { CategoryApi } from "@/api";
import { CategoryRequest, CategoryWithId } from "@/api/definitions";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { categoryColors } from "@/state/categories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetRecoilState } from "recoil";

export const useUpdateCategory = ({
  onSuccess,
}: {
  onSuccess?: (val: CategoryWithId) => void;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setColors = useSetRecoilState(categoryColors);

  const toastError = (message: string) => {
    toast({
      title: "Error updating category",
      description: message,
      variant: "destructive",
    });
  };

  const mutation = useMutation({
    mutationFn: async (params: CategoryRequest["update"]) => {
      return await CategoryApi.update(params);
    },
    onSuccess: async (data) => {
      if (data.isErr) {
        toastError(data.error.message);
        return;
      }
      toast({
        title: "Category updated",
        variant: "default",
      });
      await queryClient.invalidateQueries(queryKeys.categories.all);
      setColors((prev) => ({
        ...prev,
        [data.value.name]: data.value.color,
      }));

      if (onSuccess) {
        onSuccess(data.value);
      }
    },
    onError: (error) => {
      toastError(error.message);
    },
  });

  return mutation;
};
