"use client";

import {
  RecurringSessionInterval,
  SessionTemplate,
} from "@/api/definitions/models/session-template";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Separator } from "@/components/shadcn/separator";
import { SessionCard } from "@/components/visualizers/sessions/SessionCard";
import { addMinutes, format, startOfDay, startOfWeek } from "date-fns";
import { FC } from "react";

type TemplateCardProps = {
  template: SessionTemplate;
};

export const intervalToStartOf = (
  interval: RecurringSessionInterval,
  asOf: Date,
): Date => {
  switch (interval) {
  case "daily":
    return startOfDay(asOf);
  case "weekly":
    return startOfWeek(asOf);
  }
};

export const TemplateCard: FC<TemplateCardProps> = (props) => {
  const relativeDate = intervalToStartOf(props.template.interval, new Date());
  return (
    <Card className="border-pink-100/50 bg-gradient-to-br from-pink-50/30 via-purple-50/20 to-pink-50/10 dark:border-pink-900/30 dark:from-pink-950/20 dark:via-purple-950/10 dark:to-pink-950/5 shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-500/5 to-purple-500/3 rounded-bl-full" />
        
        <div className="flex items-center gap-3 relative">
          <div className="w-1.5 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full" />
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            {props.template.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex grow-0 flex-col space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-pink-400 rounded-full" />
            <span className="text-muted-foreground">Interval:</span>
            <span className="font-medium capitalize bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {props.template.interval}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full" />
            <span className="text-muted-foreground">Start:</span>
            <span className="font-medium">{format(props.template.start_date, "MMM dd, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-pink-400 rounded-full" />
            <span className="text-muted-foreground">End:</span>
            <span className="font-medium">{format(props.template.end_date, "MMM dd, yyyy")}</span>
          </div>
        </div>
        
        <Separator className="w-full bg-gradient-to-r from-pink-200/50 via-purple-200/50 to-pink-200/50 dark:from-pink-800/30 dark:via-purple-800/30 dark:to-pink-800/30" />
        
        <div className="space-y-3">
          <h4 className="font-semibold text-sm bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded flex items-center justify-center">
              <div className="w-2 h-2 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full" />
            </div>
            Sessions ({props.template.sessions.length})
          </h4>
          <div className="space-y-2">
            {props.template.sessions.map((session) => {
              const startTime = addMinutes(
                relativeDate,
                session.start_minute_offset,
              );
              const endTime = addMinutes(relativeDate, session.end_minute_offset);
              return (
                <div
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-pink-200/30 bg-gradient-to-r from-pink-50/20 to-purple-50/10 dark:border-pink-800/20 dark:from-pink-950/10 dark:to-purple-950/5"
                  key={session.category.id}
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-0">
                    <div className="w-1.5 h-1.5 bg-pink-400 rounded-full flex-shrink-0" />
                    <span className="truncate">
                      {format(startTime, "MMM dd, HH:mm")} - {format(endTime, "HH:mm")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <SessionCard
                      session={{
                        ...session,
                        template: props.template,
                        startTime,
                        endTime,
                        session_type: "fixed",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
