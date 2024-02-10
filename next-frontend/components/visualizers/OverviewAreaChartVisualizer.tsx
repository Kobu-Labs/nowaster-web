"use client";

import { GroupingOptions, groupSessions } from "@/lib/session-grouping";
import { formatTime, randomColor } from "@/lib/utils";
import { categoryColors } from "@/state/categories";
import { ScheduledSession } from "@/validation/models";
import { FC } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRecoilState } from "recoil";

type OverviewChartProps = {
  data: ScheduledSession[],
  groupingOpts: GroupingOptions
}

export const OverviewAreaChartVisualizer: FC<OverviewChartProps> = (props) => {
  const { groupedSessions, uniqueCategories } = groupSessions(props.data, props.groupingOpts);

  const [colors, setColors] = useRecoilState(categoryColors);
  const unsetCategoryColors: { [label: string]: string } = {};
  uniqueCategories.forEach(category => {
    if (colors[category] === undefined) {
      unsetCategoryColors[category] = randomColor();
    }
  });

  if (Object.entries(unsetCategoryColors).length !== 0) {
    setColors({ ...colors, ...unsetCategoryColors });
  }

  return (
    <ResponsiveContainer width={"100%"} height={250} >
      <AreaChart data={groupedSessions} >
        <XAxis includeHidden dataKey="granularity" />
        <YAxis tickFormatter={(x) => formatTime(x)} />
        <Tooltip content={data => customTooltip(data, colors)} />
        {uniqueCategories.map(category => {
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
    return <div />;
  }
  const values: [string: number] = data.payload[0]?.payload;

  return values
    ? <div className="rounded-sm p-2">
      {Object.entries(values).map(([k, v]) => {
        if (k !== "granularity") {
          return <p
            key={k}
            style={{ "--legend-color": colors[k] } as React.CSSProperties}
            className={"text-[var(--legend-color)]"}
          >
            {`${k}  ${formatTime(v)}`}
          </p>;
        }
        return <></>;
      })}
    </div>
    : < div />;
};
