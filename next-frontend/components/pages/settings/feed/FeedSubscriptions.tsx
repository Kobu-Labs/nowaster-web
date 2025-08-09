"use client";

import {
  ReadFeedSubscription,
  ReadUserAvatar,
} from "@/api/definitions/models/feed";
import {
  getSubscriptions,
  unsubscribe,
  updateSubscription,
} from "@/api/feedApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcn/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Switch } from "@/components/shadcn/switch";
import { useToast } from "@/components/shadcn/use-toast";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Users } from "lucide-react";
import { FC } from "react";

export function FeedSubscriptions() {
  const {
    data: subscriptions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["feed-subscriptions"],
    queryFn: getSubscriptions,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading subscriptions...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-red-500 text-center">
            Failed to load subscriptions
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feed Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No feed subscriptions found
            </p>
            <p className="text-sm text-muted-foreground">
              Follow some friends to see their activity in your feed!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feed Subscriptions</CardTitle>
        <p className="text-muted-foreground">
          Manage your feed subscriptions. You can mute or pause subscriptions to
          control what appears in your feed.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subscriptions.map((subscription) => {
            switch (subscription.source_type) {
            case "user":
              return (
                <UserSubscriptionCard
                  user={subscription.source_data}
                  subscription={subscription}
                  key={subscription.id}
                />
              );
            case "placeholder":
              return null;
            }
          })}
        </div>
      </CardContent>
    </Card>
  );
}

type UserSubscriptionCardProps = {
  user: ReadUserAvatar;
  subscription: ReadFeedSubscription;
};

const UserSubscriptionCard: FC<UserSubscriptionCardProps> = ({
  user,
  subscription,
}) => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const { toast } = useToast();
  const updateSubscriptionMutation = useMutation({
    mutationFn: updateSubscription,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feed-subscriptions"] });
      toast({ title: "Subscription updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update subscription", variant: "destructive" });
      console.error("Update subscription error:", error);
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: unsubscribe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feed-subscriptions"] });
      toast({ title: "Successfully unsubscribed" });
    },
    onError: (error) => {
      toast({ title: "Failed to unsubscribe", variant: "destructive" });
      console.error("Unsubscribe error:", error);
    },
  });

  const handleTogglePaused = (paused: boolean) => {
    updateSubscriptionMutation.mutate({
      subscription_id: subscription.id,
      is_paused: paused,
    });
  };

  const handleUnsubscribe = () => {
    unsubscribeMutation.mutate({
      source_id: user.id,
      source_type: "user",
    });
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar_url ?? undefined} alt={user.username} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {getInitials(user.username)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{user.username}</h3>
            {userId === user.id && <Badge variant="secondary">You</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            Subscribed {new Date(subscription.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label
            htmlFor={`pause-${subscription.id}`}
            className="text-sm font-medium"
          >
            Paused
          </label>
          <Switch
            id={`pause-${subscription.id}`}
            checked={subscription.is_paused}
            onCheckedChange={(checked) => handleTogglePaused(checked)}
            disabled={updateSubscriptionMutation.isPending}
          />
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-destructive"
              disabled={unsubscribeMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Unsubscribe from {user.username}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently remove this subscription from your
                feed. You will no longer see activities from {user.username} in
                your feed. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUnsubscribe}
                className="bg-red-600 hover:bg-red-700"
                disabled={unsubscribeMutation.isPending}
              >
                {unsubscribeMutation.isPending
                  ? "Unsubscribing..."
                  : "Unsubscribe"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
