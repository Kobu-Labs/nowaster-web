import { FriendsApi } from "@/api";
import { useCurrentUser } from "@/components/hooks/user/useCurrentUser";
import { useQuery } from "@tanstack/react-query";

export const useMyFriends = () => {
  const { data: user } = useCurrentUser();

  if (!user) {
    return null;
  }

  const query = useQuery({
    queryFn: async () => {
      const data = await FriendsApi.read();

      return data.map((friendship) => {
        return {
          cratedAt: friendship.created_at,
          friend:
            friendship.friend1.id === user.id
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
