"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { MoreHorizontal, Search, UserMinus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FriendsApi } from "@/api";
import { Skeleton } from "@/components/shadcn/skeleton";
import Image from "next/image";
import { useMyFriends } from "@/components/hooks/friends/useMyFriends";
import { getInitials } from "@/lib/utils";

export const FriendsList = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [friendToRemove, setFriendToRemove] = useState<null | string>(null);

  const query = useMyFriends();

  const mutation = useMutation({
    mutationFn: async (friendship_id: string) => {
      return await FriendsApi.remove({ friendship_id });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["friends", "my"] });
      setFriendToRemove(null);
    },
  });

  const filteredFriends =
    query.data?.filter((friendship) =>
      friendship.friend.username
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    ) ?? [];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          onChange={(e) => { setSearchQuery(e.target.value); }}
          placeholder="Search friends..."
          type="search"
          value={searchQuery}
        />
      </div>

      {query.isSuccess ? (filteredFriends.length === 0 ? (
        <div className="text-center gap-10 flex flex-col items-center justify-center">
          <p className="text-muted-foreground">No friends found :(</p>
          <Image
            alt={""}
            height={200}
            src={"/forever-alone.png"}
            width={200}
          ></Image>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredFriends.map((friendship) => (
            <Card key={friendship.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage
                          alt={friendship.friend.username}
                          src={friendship.friend.avatar_url ?? undefined}
                        />
                        <AvatarFallback>
                          {getInitials(friendship.friend.username)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <p className="font-medium">
                        {friendship.friend.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => { setFriendToRemove(friendship.id); }}
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          Remove Friend
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )) : (
        <div className="flex items-center justify-center py-10">
          <Skeleton className="w-full h-32" />
        </div>
      )}

      <AlertDialog
        onOpenChange={(open) => !open && setFriendToRemove(null)}
        open={!!friendToRemove}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this friend? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { mutation.mutate(friendToRemove!); }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
