"use client";

import { formatDistanceToNow } from "date-fns";
import { FolderCheck } from "lucide-react";
import type { FC } from "react";
import { Cell, Label, Pie, PieChart, ResponsiveContainer } from "recharts";
import type {
  ProjectCompletedEventSchema,
  ReadFeedEvent,
  ReadUserAvatar,
} from "@/api/definitions/models/feed";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Card, CardContent } from "@/components/shadcn/card";
import {
  renderActiveShape,
  SessionPieChartUiProvider,
} from "@/components/ui-providers/session/charts/SessionPieChartUiProvider";
import { CategoryBadge } from "@/components/visualizers/categories/CategoryBadge";
import { ReactionBar } from "@/components/visualizers/feed/ReactionBar";
import { ProjectAvatar } from "@/components/visualizers/projects/ProjectAvatar";
import { ProjectBadge } from "@/components/visualizers/projects/ProjectBadge";
import { formatTime, getInitials, randomColor } from "@/lib/utils";
import type { z } from "zod";

type ProjectCompletedFeedCardProps = {
  event: ReadFeedEvent;
  event_data: z.infer<typeof ProjectCompletedEventSchema>;
  user: ReadUserAvatar;
};

export const ProjectCompletedFeedCard: FC<ProjectCompletedFeedCardProps> = ({
  event,
  event_data,
  user,
}) => {
  const chartData = event_data.tasks_time_breakdown.map((task) => ({
    color: randomColor(),
    name: task.task_name,
    value: task.minutes,
  }));

  const totalMinutes = event_data.tasks_time_breakdown.reduce(
    (sum, task) => sum + task.minutes,
    0,
  );

  return (
    <Card className="w-full">
      <CardContent className="pt-6 space-y-4">
        <div className="flex">
          <div className="flex flex-col gap-2">
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
                  <FolderCheck className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    Completed a project
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(event.created_at, {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ProjectAvatar
                color={event_data.project_color}
                imageUrl={event_data.project_image_url}
                name={event_data.project_name}
                size={48}
              />
              <div className="flex-1">
                <ProjectBadge
                  color={event_data.project_color}
                  completed
                  name={event_data.project_name}
                  skipStrikethrough
                />
                {event_data.project_description && (
                  <p className="text-sm text-muted-foreground">
                    {event_data.project_description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-20 flex-wrap">
            {chartData.length > 0 && (
              <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                <div className="w-[180px] h-[180px] flex-shrink-0">
                  <ResponsiveContainer height={180} width={180}>
                    <PieChart>
                      <Pie
                        activeShape={renderActiveShape}
                        cx="50%"
                        cy="50%"
                        data={chartData}
                        dataKey="value"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            fill={entry.color}
                            fillOpacity={0.4}
                            key={`cell-${index}`}
                            stroke={entry.color}
                          />
                        ))}
                        <Label
                          fill="#fff"
                          position="center"
                          value={formatTime(totalMinutes)}
                        />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-1 text-sm flex-1">
                  <h5 className="font-semibold text-xs mb-1">Tasks</h5>
                  {event_data.tasks_time_breakdown.map((val, index) => {
                    return (
                      <div className="flex items-center gap-2" key={index}>
                        <div
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: chartData[index]?.color }}
                        />
                        <span className="truncate">{val.task_name}</span>
                        <span className="text-muted-foreground ml-auto">
                          {formatTime(val.minutes)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="font-bold pt-1 border-t text-xs">
                    Total:
                    {" "}
                    {formatTime(totalMinutes)}
                  </div>
                </div>
              </div>
            )}

            {/* Category breakdown pie chart */}
            {event_data.categories_time_breakdown.length > 0 && (
              <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                <div className="w-[180px] h-[180px] flex-shrink-0">
                  <SessionPieChartUiProvider
                    data={event_data.categories_time_breakdown.map((value) => ({
                      key: value.category_name,
                      metadata: {
                        color: value.category_color,
                        name: value.category_name,
                      },
                      value: value.minutes,
                    }))}
                  />
                </div>
                <div className="flex flex-col gap-1 text-sm flex-1">
                  <h5 className="font-semibold text-xs mb-1">Categories</h5>
                  {event_data.categories_time_breakdown.map((val) => (
                    <div
                      className="hover:bg-pink-muted flex items-center justify-between rounded px-2"
                      key={val.category_id}
                    >
                      <CategoryBadge
                        color={val.category_color}
                        name={val.category_name}
                      />
                      <p className="text-muted-foreground">
                        {formatTime(val.minutes)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <ReactionBar event={event} reactions={event.reactions} />
      </CardContent>
    </Card>
  );
};
