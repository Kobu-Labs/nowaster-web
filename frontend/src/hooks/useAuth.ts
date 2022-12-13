import { useQuery } from "@tanstack/react-query";
import { AuthApi } from "../services";

const useAuth = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["auth"],
    retry: false,
    queryFn: async () => await AuthApi.auth(),
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  return { auth: data, isLoading, isError };
};

export default useAuth;
