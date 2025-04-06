"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { Badge } from "@/components/shadcn/badge";
import { useQuery } from "@tanstack/react-query";
import { FriendRequestApi } from "@/api";
import { AddFriend } from "@/components/visualizers/friends/AddFriend";
import { FriendRequest } from "@/components/visualizers/friends/FriendRequest";

export const FriendRequestsManagement = () => {
  const incomingRequests = useQuery({
    queryKey: ["friends", "requests", "incoming"],
    queryFn: async () => {
      const data = await FriendRequestApi.read({ direction: "incoming" });
      if (data.isErr) {
        throw new Error(data.error.message);
      }

      return data.value;
    },
    initialData: [],
  });

  const outgoingRequests = useQuery({
    queryKey: ["friends", "requests", "outgoing"],
    queryFn: async () => {
      const data = await FriendRequestApi.read({ direction: "outgoing" });
      if (data.isErr) {
        throw new Error(data.error.message);
      }

      return data.value;
    },
    initialData: [],
  });

  if (incomingRequests.isError || outgoingRequests.isError) {
    return <div>Error</div>;
  }

  return (
    <Tabs defaultValue="incoming" className="w-full">
      <AddFriend />
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="incoming">
          Incoming
          {incomingRequests.data.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {incomingRequests.data.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="outgoing">
          Outgoing
          {outgoingRequests.data.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {outgoingRequests.data.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="incoming" className="space-y-4">
        {incomingRequests.data.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No incoming friend requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomingRequests.data.map((request) => (
              <FriendRequest
                key={request.id}
                request={request}
                direction={"incoming"}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="outgoing" className="space-y-4">
        {outgoingRequests.data.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No outgoing friend requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {outgoingRequests.data.map((request) => (
              <FriendRequest
                key={request.id}
                request={request}
                direction={"outgoing"}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};
