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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">
          {props.template.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex grow-0 flex-col">
        <div>Interval: {props.template.interval}</div>
        <div>Start Date: {props.template.start_date.toDateString()}</div>
        <div>End Date: {props.template.end_date.toDateString()}</div>
        <Separator className="w-full" />
        <div>
          Sessions:
          {props.template.sessions.map((session) => {
            const startTime = addMinutes(
              relativeDate,
              session.start_minute_offset,
            );
            const endTime = addMinutes(relativeDate, session.end_minute_offset);
            return (
              <div
                className="flex flex-row items-center gap-2"
                key={session.category.id}
              >
                {format(startTime, "dd. MMM hh:mm")} -{" "}
                {format(endTime, "dd. MMM hh:mm ")}
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
