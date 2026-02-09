"use client";

import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";
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
import { ProjectBadge } from "@/components/visualizers/projects/ProjectBadge";
import { TagBadge } from "@/components/visualizers/tags/TagBadge";
import { TaskBadge } from "@/components/visualizers/tasks/TaskBadge";
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
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{user.username}</span>
              <span className="text-sm text-muted-foreground">
                completed a session
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(event.created_at, {
                addSuffix: true,
              })}
            </div>

            {event_data.project && event_data.task && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs text-muted-foreground font-medium">
                  In Project:
                </span>
                <ProjectBadge
                  color={event_data.project.color}
                  name={event_data.project.name}
                  size="sm"
                />
                <span className="text-muted-foreground mx-0.5">/</span>
                <TaskBadge name={event_data.task.name} size="sm" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {event_data.description && (
          <p className="text-sm text-muted-foreground">
            {event_data.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2 flex-wrap items-center">
            <CategoryBadge
              color={event_data.category.color}
              name={event_data.category.name}
            />
            {event_data.tags.length > 0 && (
              <>
                <span className="text-muted-foreground">•</span>
                {event_data.tags.slice(0, 3).map((tag, index) => (
                  <TagBadge key={index} tag={tag} variant="auto" />
                ))}
                {event_data.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground font-medium">
                    +
                    {event_data.tags.length - 3}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {getFormattedTimeDifference(
                event_data.start_time,
                event_data.end_time,
              )}
            </span>
          </div>
        </div>

        <ReactionBar event={event} reactions={event.reactions} />
      </CardContent>
    </Card>
  );
};
