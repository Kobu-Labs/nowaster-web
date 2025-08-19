"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { FriendsList } from "@/components/visualizers/friends/FriendList";
import { FriendRequestsManagement } from "@/components/visualizers/friends/FriendRequestManagement";
import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";

export default function FriendsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentTab = searchParams.get("tab") ?? "friends";

  const handleTabChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  return (
    <div className="container py-10 max-w-5xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
          <p className="text-muted-foreground">
            Manage your friends, requests, and find new connections.
          </p>
        </div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
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
