"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FC } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";


export type Granularity = "week" | "month" | "year"
type ValueByCategory = { [category: string]: string } & { granularity: string }

type OverviewChartProps = {
  granularity: Granularity,
  setGranularity: (val: Granularity) => void,
  data: ValueByCategory[],
  categories: string[],
  ticks: number[],
  amount: number,
}


export const OverviewAreaChartVisualizer: FC<OverviewChartProps> = (props) => {
  const colors: { [category: string]: string } = {};
  props.categories.forEach((category) => colors[category] = "#" + Math.floor(Math.random() * 16777215).toString(16));

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>Overview Per Category</CardTitle>
          <Select onValueChange={(val: Granularity) => props.setGranularity(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="year">Past year</SelectItem>
                <SelectItem value="month">Past month</SelectItem>
                <SelectItem value="week">Past week</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent >
        <ResponsiveContainer width={"100%"} height={250} >
          <AreaChart data={props.data}>
            <XAxis ticks={props.ticks} type="number" interval={0} domain={[1, props.amount]} dataKey="granularity" />
            <YAxis />
            <Tooltip content={(data) => customTooltip(data, colors)} />
            {props.categories.map(category => {
              /* BUG:  color switching - implement fix later */
              return (<Area key={category} fill={colors[category]} type="monotone" stackId="1" dataKey={(v) => v[category] || 0} stroke={colors[category]} strokeWidth={4} fillOpacity={0.4} />);
            })}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const customTooltip = (data: any, colors: any) => {
  if (!data.payload) {
    return <div />;
  }
  const values = data.payload[0]?.payload;

  /* BUG: tailwind classes cannot be computed dynamically - use style prop to set a variable, use the variable inside the className prop*/
  return values
    ? <div className="rounded-sm p-2">
      {Object.entries(values).map(([k, v]) => {
        if (k !== "granularity") {
          return <p key={k} className={`text-[${colors[k]}]`}>{`${k}:${v}`}</p>;
        }
      })}
    </div>
    : < div />;
};
