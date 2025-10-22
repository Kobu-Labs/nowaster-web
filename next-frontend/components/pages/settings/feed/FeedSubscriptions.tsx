"use client";

import type {
  ReadFeedSubscription,
  ReadUserAvatar,
} from "@/api/definitions/models/feed";
import {
  getSubscriptions,
  unsubscribe,
  updateSubscription,
} from "@/api/feedApi";
import { useAuth } from "@/components/hooks/useAuth";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Users } from "lucide-react";
import type { FC } from "react";

type UserSubscriptionCardProps = {
  subscription: ReadFeedSubscription;
  user: ReadUserAvatar;
};

export function FeedSubscriptions() {
  const {
    data: subscriptions,
    error,
    isLoading,
  } = useQuery({
    queryFn: getSubscriptions,
    queryKey: ["feed-subscriptions"],
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
              case "placeholder": {
                return null;
              }
              case "user": {
                return (
                  <UserSubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    user={subscription.source_data}
                  />
                );
              }
            }
          })}
        </div>
      </CardContent>
    </Card>
  );
}

const UserSubscriptionCard: FC<UserSubscriptionCardProps> = ({
  subscription,
  user,
}) => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { toast } = useToast();
  const updateSubscriptionMutation = useMutation({
    mutationFn: updateSubscription,
    onError: () => {
      toast({ title: "Failed to update subscription", variant: "destructive" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feed-subscriptions"] });
      toast({ title: "Subscription updated successfully" });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: unsubscribe,
    onError: () => {
      toast({ title: "Failed to unsubscribe", variant: "destructive" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["feed-subscriptions"] });
      toast({ title: "Successfully unsubscribed" });
    },
  });

  const handleTogglePaused = (paused: boolean) => {
    updateSubscriptionMutation.mutate({
      is_paused: paused,
      subscription_id: subscription.id,
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
          <AvatarImage alt={user.username} src={user.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {getInitials(user.username)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{user.username}</h3>
            {currentUser?.id === user.id && <Badge variant="secondary">You</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            Subscribed
            {new Date(subscription.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label
            className="text-sm font-medium"
            htmlFor={`pause-${subscription.id}`}
          >
            Paused
          </label>
          <Switch
            checked={subscription.is_paused}
            disabled={updateSubscriptionMutation.isPending}
            id={`pause-${subscription.id}`}
            onCheckedChange={(checked) => { handleTogglePaused(checked); }}
          />
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="text-red-600 hover:text-red-700 hover:bg-destructive"
              disabled={unsubscribeMutation.isPending}
              size="sm"
              variant="outline"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Unsubscribe from
                {user.username}
                ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently remove this subscription from your
                feed. You will no longer see activities from
                {user.username}
                in
                your feed. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                disabled={unsubscribeMutation.isPending}
                onClick={handleUnsubscribe}
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
