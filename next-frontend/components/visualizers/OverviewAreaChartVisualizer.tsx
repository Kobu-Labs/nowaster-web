"use client";

import { Granularity, SessionsByCategory } from "@/lib/session-grouping";
import { formatTime } from "@/lib/utils";
import { FC } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type OverviewChartProps = {
  granularity: keyof typeof Granularity,
  data: SessionsByCategory[],
  categories: string[],
  ticks?: number[],
}


export const OverviewAreaChartVisualizer: FC<OverviewChartProps> = (props) => {
  const colors: { [category: string]: string } = {};
  props.categories.forEach((category) => colors[category] = "#" + Math.floor(Math.random() * 16777215).toString(16));

  return (
    <ResponsiveContainer width={"100%"} height={250} >
      <AreaChart data={props.data}>
        <XAxis ticks={props.ticks} type="number" interval={0} domain={props.ticks ? [1, props.ticks.length] : [1]} dataKey="granularity" />
        <YAxis />
        <Tooltip content={(data) => customTooltip(data, colors)} />
        {props.categories.map(category => {
          /* BUG:  color switching - implement fix later */
          return (<Area key={category} fill={colors[category]} type="monotone" stackId="1" dataKey={(v) => v[category] || 0} stroke={colors[category]} strokeWidth={4} fillOpacity={0.4} />);
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
};

const customTooltip = (data: any, colors: any) => {
  if (!data.payload) {
    return <div />;
  }
  const values: [string: number] = data.payload[0]?.payload;

  /* BUG: tailwind classes cannot be computed dynamically - use style prop to set a variable, use the variable inside the className prop*/
  return values
    ? <div className="rounded-sm p-2">
      {Object.entries(values).map(([k, v]) => {
        if (k !== "granularity") {
          return <p key={k} className={`text-[${colors[k]}]`}>{`${k}  ${formatTime(v)}`}</p>;
        }
        return <></>;
      })}
    </div>
    : < div />;
};
