/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import type { FC } from "react";
import { useState } from "react";
import { categoryColors } from "@/state/categories";
import type { ScheduledSession } from "@/api/definitions";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { GroupingOptions } from "@/lib/session-grouping";
import { groupSessions } from "@/lib/session-grouping";
import { formatTime, randomColor } from "@/lib/utils";
import { Card } from "@/components/shadcn/card";
import { Separator } from "@/components/shadcn/separator";
import { useAtomValue } from "jotai";

interface SessionBaseAreaChartUiProviderProps {
  data: ScheduledSession[];
  groupingOpts: GroupingOptions;
}

export const SessionBaseAreaChartUiProvider: FC<
  SessionBaseAreaChartUiProviderProps
> = (props) => {
  const { groupedSessions, uniqueCategories } = groupSessions(
    props.data,
    props.groupingOpts,
  );
  const [fallbackColor] = useState(randomColor());
  const colors = useAtomValue(categoryColors);

  if (props.data.length === 0) {
    return (
      <div className="flex size-full items-center justify-center">
        <span>No results</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer>
      <AreaChart data={groupedSessions}>
        <XAxis dataKey="granularity" includeHidden />
        <YAxis tickFormatter={(x: number) => formatTime(x)} />
        <Tooltip content={(data) => customTooltip(data, colors)} />
        {uniqueCategories.map((category) => {
          return (
            <Area
              dataKey={(v: Record<string, number>) => v[category] ?? 0}
              fill={colors[category] ?? fallbackColor}
              fillOpacity={0.4}
              key={category}
              stackId="1"
              stroke={colors[category] ?? fallbackColor}
              strokeWidth={4}
              type="monotone"
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
};

const customTooltip = (data: any, colors: Record<string, string>) => {
  if (!data.payload) {
    return <></>;
  }

  const values: [string: number] = data.payload[0]?.payload;
  if (!values) {
    return <></>;
  }

  const filteredValues = Object.entries(values).filter(
    ([key]) => key !== "granularity",
  );
  if (filteredValues.length === 0) {
    return <></>;
  }
  const totalTime = filteredValues.reduce((acc, [_, time]) => {
    return acc + time;
  }, 0);

  return (
    <Card className="rounded-sm p-2 gradient-card-solid">
      {filteredValues.map(([category, totalTime], i) => {
        return (
          <div className="flex items-center justify-between gap-2" key={i}>
            <p
              className={"text-(--legend-color)"}
              key={`${category}category`}
              style={
                { "--legend-color": colors[category] } as React.CSSProperties
              }
            >
              {category}
            </p>
            <p
              className={"text-(--legend-color)"}
              key={`${category}time`}
              style={
                { "--legend-color": colors[category] } as React.CSSProperties
              }
            >
              {formatTime(totalTime)}
            </p>
          </div>
        );
      })}
      <Separator className="h-0.5" />
      <div className="flex items-center justify-between gap-2">
        <p className={"text-(--legend-color)"}>Total Time</p>
        <p className={"text-(--legend-color)"}>{formatTime(totalTime)}</p>
      </div>
    </Card>
  );
};
