"use client";

import { AmountByCategory } from "@/components/visualizers/charts/SessionPieChart";
import { formatTime, randomColor } from "@/lib/utils";
import { tagColors } from "@/state/tags";
import { FC, useState } from "react";
import { Cell, Label, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import { useRecoilState } from "recoil";

type SessionPieChartUiProviderProps = {
  data: AmountByCategory[],
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={0} textAnchor="middle" fill={fill}>
        {payload.key}
      </text>
      <text x={cx} y={cy} dy={19} textAnchor="middle" fill={fill}>
        {formatTime(payload.value)}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

export const SessionPieChartUiProvider: FC<SessionPieChartUiProviderProps> = (props) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const [colors, setColors] = useRecoilState(tagColors);
  const result: { [label: string]: string } = {};


  (props.data).forEach(({ key }) => {
    if (colors[key] === undefined) {
      result[key] = randomColor();
    }
  });

  if (Object.entries(result).length !== 0) {
    setColors({ ...colors, ...result });
  }


  return (
    <ResponsiveContainer width={"100%"} height={180}  >
      <PieChart
        onMouseLeave={() => setActiveIndex(undefined)}>
        <Pie
          data={props.data}
          dataKey="value"
          nameKey="key"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          activeShape={renderActiveShape}
          onMouseEnter={(_, i) => setActiveIndex(i)}
          activeIndex={activeIndex}
        >
          {props.data.map(({key}, index) => {
            return <Cell fillOpacity={0.4} stroke={colors[key]} key={`cell-${index}`} fill={colors[key]} />;
          })}
          {activeIndex === undefined && <Label
            value={formatTime(props.data.reduce((acc, curr) => acc + curr.value, 0))}
            position="center"
            fill={"#fff"}
          />}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
