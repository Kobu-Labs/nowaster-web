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
    initialData: [],
    queryFn: async () => {
      return await FriendRequestApi.read({ direction: "incoming" });
    },
    queryKey: ["friends", "requests", "incoming"],
  });

  const outgoingRequests = useQuery({
    initialData: [],
    queryFn: async () => {
      return await FriendRequestApi.read({ direction: "outgoing" });
    },
    queryKey: ["friends", "requests", "outgoing"],
  });

  if (incomingRequests.isError || outgoingRequests.isError) {
    return <div>Error</div>;
  }

  return (
    <Tabs className="w-full" defaultValue="incoming">
      <AddFriend />
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="incoming">
          Incoming
          {incomingRequests.data.length > 0 && (
            <Badge className="ml-2" variant="secondary">
              {incomingRequests.data.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="outgoing">
          Outgoing
          {outgoingRequests.data.length > 0 && (
            <Badge className="ml-2" variant="secondary">
              {outgoingRequests.data.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent className="space-y-4" value="incoming">
        {incomingRequests.data.length === 0
          ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No incoming friend requests</p>
              </div>
            )
          : (
              <div className="space-y-4">
                {incomingRequests.data.map((request) => (
                  <FriendRequest
                    direction="incoming"
                    key={request.id}
                    request={request}
                  />
                ))}
              </div>
            )}
      </TabsContent>

      <TabsContent className="space-y-4" value="outgoing">
        {outgoingRequests.data.length === 0
          ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No outgoing friend requests</p>
              </div>
            )
          : (
              <div className="space-y-4">
                {outgoingRequests.data.map((request) => (
                  <FriendRequest
                    direction="outgoing"
                    key={request.id}
                    request={request}
                  />
                ))}
              </div>
            )}
      </TabsContent>
    </Tabs>
  );
};
