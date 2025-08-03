"use client";

import { FC } from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock, Play, CheckCircle } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/shadcn/card";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/shadcn/avatar";
import { ReadFeedEvent } from "@/api/definitions/models/feed";
import { cn, getFormattedTimeDifference } from "@/lib/utils";
import { CategoryWithId, TagWithId } from "@/api/definitions";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { ReactionBar } from "@/components/visualizers/feed/ReactionBar";

interface SessionFeedCardProps {
  event: ReadFeedEvent;
}

interface SessionEventData {
  session_id: string;
  session_type: string;
  category: CategoryWithId;
  tags: TagWithId[];
  description?: string;
  start_time: Date;
  end_time: Date;
}

export const SessionCompletedFeedCard: FC<SessionFeedCardProps> = ({ event }) => {
  const sessionData = event.event_data as SessionEventData;

  const getEventIcon = () => {
    switch (event.event_type) {
      case "session_started":
        return <Play className="h-4 w-4 text-green-500" />;
      case "session_completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventText = () => {
    switch (event.event_type) {
      case "session_started":
        return "started a session";
      case "session_completed":
        return "completed a session";
      default:
        return "had session activity";
    }
  };

  const getDurationText = () => {
    if (
      event.event_type === "session_completed" &&
      sessionData.start_time &&
      sessionData.end_time
    ) {
      return getFormattedTimeDifference(
        sessionData.start_time,
        sessionData.end_time,
      );
    }
    return null;
  };

  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            {event.user.avatar_url ? (
              <AvatarImage
                src={event.user.avatar_url}
                alt={event.user.username}
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(event.user.username)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{event.user.username}</span>
              {getEventIcon()}
              <span className="text-sm text-muted-foreground">
                {getEventText()}
              </span>
              {sessionData.category && (
                <CategoryBadge
                  color={sessionData.category.color}
                  name={sessionData.category.name}
                />
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(event.created_at), {
                addSuffix: true,
              })}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {sessionData.description && (
          <p className="text-sm text-muted-foreground">
            {sessionData.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {sessionData.tags.map((tag, index) => (
              <TagBadge variant="auto" tag={tag} key={index} />
            ))}
          </div>

          {getDurationText() && (
            <div className="flex items-center gap-1 text-sm font-medium">
              <Clock className="h-3 w-3" />
              {getDurationText()}
            </div>
          )}
        </div>

        <ReactionBar event={event} reactions={event.reactions} />
      </CardContent>
    </Card>
  );
};
