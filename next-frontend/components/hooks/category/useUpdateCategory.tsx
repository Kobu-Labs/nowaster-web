import { CategoryApi } from "@/api";
import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useToast } from "@/components/shadcn/use-toast";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { categoryColors } from "@/state/categories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSetRecoilState } from "recoil";

export const useUpdateCategory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setColors = useSetRecoilState(categoryColors);

  const mutation = useMutation({
    mutationFn: CategoryApi.update,
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
            <CategoryBadge name={data.name} color={data.color} />
            updated
          </div>
        ),
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return mutation;
};
