"use client";

import { formatDistanceToNow } from "date-fns";
import { Clock, SquareCheckBig } from "lucide-react";
import type { FC } from "react";

import type {
  ReadFeedEvent,
  ReadUserAvatar,
  TaskCompletedEventSchema,
} from "@/api/definitions/models/feed";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Card, CardContent, CardHeader } from "@/components/shadcn/card";
import { ReactionBar } from "@/components/visualizers/feed/ReactionBar";
import { ProjectAvatar } from "@/components/visualizers/projects/ProjectAvatar";
import { ProjectBadge } from "@/components/visualizers/projects/ProjectBadge";
import { getInitials } from "@/lib/utils";
import type { z } from "zod";

type TaskCompletedFeedCardProps = {
  event: ReadFeedEvent;
  event_data: z.infer<typeof TaskCompletedEventSchema>;
  user: ReadUserAvatar;
};

export const TaskCompletedFeedCard: FC<TaskCompletedFeedCardProps> = ({
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
              <SquareCheckBig className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Completed a task
              </span>
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
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <ProjectAvatar
              color={event_data.project.color}
              imageUrl={event_data.project.image_url}
              name={event_data.project.name}
              size={24}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <ProjectBadge
                  color={event_data.project.color}
                  name={event_data.project.name}
                />
                <span className="text-muted-foreground">/</span>
                <SquareCheckBig className="h-4 w-4 text-green-600" />
                <h4 className="font-semibold text-sm">
                  {event_data.task_name}
                </h4>
              </div>
              {event_data.task_description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {event_data.task_description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium flex-shrink-0">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {event_data.hours_of_work.toFixed(1)}h
            </div>
          </div>
        </div>

        <ReactionBar event={event} reactions={event.reactions} />
      </CardContent>
    </Card>
  );
};
