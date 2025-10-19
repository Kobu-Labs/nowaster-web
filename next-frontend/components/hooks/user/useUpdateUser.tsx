import * as UserApi from "@/api/userApi";
import type { UserRequest } from "@/api/definitions/requests/user";
import { useAuth } from "@/components/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: Omit<UserRequest["update"], "id">) =>
      await UserApi.update({ ...params, id: user?.id ?? "" }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["user", "current", user?.id], data);
      await queryClient.invalidateQueries({ queryKey: ["user", "current"] });
    },
  });
};
