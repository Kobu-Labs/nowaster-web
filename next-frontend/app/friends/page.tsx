import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { FriendsList } from "@/components/visualizers/friends/FriendList";
import { FriendRequestsManagement } from "@/components/visualizers/friends/FriendRequestManagement";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Friends Management",
  description: "Manage your friends, requests, and connections",
};

export default function FriendsPage() {
  return (
    <div className="container py-10 max-w-5xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
          <p className="text-muted-foreground">
            Manage your friends, requests, and find new connections.
          </p>
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="friends">My Friends</TabsTrigger>
            <TabsTrigger value="requests">Friend Requests</TabsTrigger>
          </TabsList>
          <TabsContent value="friends" className="space-y-4">
            <FriendsList />
          </TabsContent>
          <TabsContent value="requests" className="space-y-4">
            <FriendRequestsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
