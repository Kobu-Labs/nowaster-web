// INFO: disabled due to recharts
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import { FC, useState } from "react";
import { categoryColors } from "@/state/categories";
import { ScheduledSession } from "@/api/definitions";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRecoilValue } from "recoil";

import { GroupingOptions, groupSessions } from "@/lib/session-grouping";
import { formatTime, randomColor } from "@/lib/utils";
import { Card } from "@/components/shadcn/card";

type SessionBaseAreaChartUiProviderProps = {
  data: ScheduledSession[];
  groupingOpts: GroupingOptions;
};

export const SessionBaseAreaChartUiProvider: FC<
  SessionBaseAreaChartUiProviderProps
> = (props) => {
  const { groupedSessions, uniqueCategories } = groupSessions(
    props.data,
    props.groupingOpts,
  );
  const [fallbackColor] = useState(randomColor());
  const colors = useRecoilValue(categoryColors);

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
        <XAxis includeHidden dataKey="granularity" />
        <YAxis tickFormatter={(x: number) => formatTime(x)} />
        <Tooltip content={(data) => customTooltip(data, colors)} />
        {uniqueCategories.map((category) => {
          return (
            <Area
              key={category}
              fill={colors[category] ?? fallbackColor}
              type="monotone"
              stackId="1"
              dataKey={(v: Record<string, number>) => v[category] ?? 0}
              stroke={colors[category] ?? fallbackColor}
              strokeWidth={4}
              fillOpacity={0.4}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
};

const customTooltip = (data: any, colors: { [category: string]: string }) => {
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

  return (
    <Card className="rounded-sm p-2">
      {filteredValues.map(([category, totalTime], i) => {
        return (
          <div className="flex items-center justify-between gap-2" key={i}>
            <p
              key={category + "category"}
              style={
                { "--legend-color": colors[category] } as React.CSSProperties
              }
              className={"text-[var(--legend-color)]"}
            >
              {category}
            </p>
            <p
              key={category + "time"}
              style={
                { "--legend-color": colors[category] } as React.CSSProperties
              }
              className={"text-[var(--legend-color)]"}
            >
              {formatTime(totalTime)}
            </p>
          </div>
        );
      })}
    </Card>
  );
};
