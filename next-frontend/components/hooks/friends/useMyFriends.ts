import { FriendsApi } from "@/api";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export const useMyFriends = () => {
  const { userId } = useAuth();

  const query = useQuery({
    queryKey: ["friends", "my"],
    queryFn: async () => {
      const data = await FriendsApi.read();
      if (data.isErr) {
        throw new Error(data.error.message);
      }

      return data.value.map((friendship) => {
        return {
          id: friendship.id,
          friend:
            friendship.friend1.id === userId
              ? friendship.friend2
              : friendship.friend1,
          cratedAt: friendship.created_at,
        };
      });
    },
    enabled: !!userId,
  });

  return query;
};
