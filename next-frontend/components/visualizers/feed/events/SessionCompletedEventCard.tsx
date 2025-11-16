"use client";

import { formatDistanceToNow } from "date-fns";
import { Clock, ClockCheck } from "lucide-react";
import type { FC } from "react";

import type {
  ReadFeedEvent,
  ReadUserAvatar,
  SessionCompletedEventSchema,
} from "@/api/definitions/models/feed";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Card, CardContent, CardHeader } from "@/components/shadcn/card";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { ReactionBar } from "@/components/visualizers/feed/ReactionBar";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { getFormattedTimeDifference, getInitials } from "@/lib/utils";
import type { z } from "zod";

type SessionFeedCardProps = {
  event: ReadFeedEvent;
  event_data: z.infer<typeof SessionCompletedEventSchema>;
  user: ReadUserAvatar;
};

export const SessionCompletedFeedCard: FC<SessionFeedCardProps> = ({
  event,
  event_data,
  user,
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              alt={user.username}
              src={user.avatar_url ?? undefined}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(user.username)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{user.username}</span>
              <ClockCheck className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Completed a session
              </span>
              <CategoryBadge
                color={event_data.category.color}
                name={event_data.category.name}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(event.created_at, {
                addSuffix: true,
              })}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {event_data.description && (
          <p className="text-sm text-muted-foreground">
            {event_data.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {event_data.tags.map((tag, index) => (
              <TagBadge key={index} tag={tag} variant="auto" />
            ))}
          </div>

          <div className="flex items-center gap-1 text-sm font-medium">
            <Clock className="h-3 w-3" />
            {getFormattedTimeDifference(
              event_data.start_time,
              event_data.end_time,
            )}
          </div>
        </div>

        <ReactionBar event={event} reactions={event.reactions} />
      </CardContent>
    </Card>
  );
};
