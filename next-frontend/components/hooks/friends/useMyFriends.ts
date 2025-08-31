import { FriendsApi } from "@/api";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export const useMyFriends = () => {
  const { userId } = useAuth();

  const query = useQuery({
    enabled: !!userId,
    queryFn: async () => {
      const data = await FriendsApi.read();

      return data.map((friendship) => {
        return {
          cratedAt: friendship.created_at,
          friend:
            friendship.friend1.id === userId
              ? friendship.friend2
              : friendship.friend1,
          id: friendship.id,
        };
      });
    },
    queryKey: ["friends", "my"],
  });

  return query;
};
