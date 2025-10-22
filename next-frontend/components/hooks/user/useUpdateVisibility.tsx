import * as UserApi from "@/api/userApi";
import { useAuth } from "@/components/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateVisibility = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      visible_to_friends: boolean;
      visible_to_groups: boolean;
      visible_to_public: boolean;
    }) => await UserApi.updateVisibility(params),
    onSuccess: async (data) => {
      queryClient.setQueryData(["user", "current", user?.id], data);
    },
  });
};
