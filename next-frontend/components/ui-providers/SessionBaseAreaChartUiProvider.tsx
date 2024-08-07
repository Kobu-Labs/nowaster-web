"use client";

import { FC } from "react";
import { categoryColors } from "@/state/categories";
import { ScheduledSession } from "@kobu-labs/nowaster-js-typing";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRecoilState } from "recoil";

import { GroupingOptions, groupSessions } from "@/lib/session-grouping";
import { formatTime, randomColor } from "@/lib/utils";
import { Card } from "@/components/shadcn/card";

type SessionBaseAreaChartUiProviderProps = {
  data: ScheduledSession[]
  groupingOpts: GroupingOptions
}

export const SessionBaseAreaChartUiProvider: FC<
  SessionBaseAreaChartUiProviderProps
> = (props) => {
  const { groupedSessions, uniqueCategories } = groupSessions(
    props.data,
    props.groupingOpts
  );

  const [colors, setColors] = useRecoilState(categoryColors);
  const unsetCategoryColors: { [label: string]: string } = {};
  uniqueCategories.forEach((category) => {
    if (colors[category] === undefined) {
      unsetCategoryColors[category] = randomColor();
    }
  });

  if (Object.entries(unsetCategoryColors).length !== 0) {
    setColors({ ...colors, ...unsetCategoryColors });
  }

  return (
    <ResponsiveContainer>
      <AreaChart data={groupedSessions}>
        <XAxis includeHidden dataKey="granularity" />
        <YAxis tickFormatter={(x) => formatTime(x)} />
        <Tooltip content={(data) => customTooltip(data, colors)} />
        {uniqueCategories.map((category) => {
          return (
            <Area
              key={category}
              fill={colors[category]}
              type="monotone"
              stackId="1"
              dataKey={(v) => v[category] || 0}
              stroke={colors[category]}
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
    ([key]) => key !== "granularity"
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
