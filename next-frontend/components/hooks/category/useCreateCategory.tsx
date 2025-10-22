import { CategoryApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { categoryColors } from "@/state/categories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

export const useCreateCategory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setColors = useSetAtom(categoryColors);

  const mutation = useMutation({
    mutationFn: CategoryApi.create,
    onError: (error) => {
      toast({
        description: error.message,
        title: "Error creating category",
        variant: "destructive",
      });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries(queryKeys.categories.all);
      setColors((prev) => ({
        ...prev,
        [data.name]: data.color,
      }));

      toast({
        description: (
          <div className="flex items-center gap-2">
            Category
            <CategoryBadge color={data.color} name={data.name} />
            created
          </div>
        ),
      });
    },
  });

  return mutation;
};
