// INFO: this is due to the untyped nature of recharts
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import { FC, useState } from "react";
import { tagColors } from "@/state/tags";
import {
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
} from "recharts";
import { useRecoilValue } from "recoil";

import { formatTime, randomColor } from "@/lib/utils";
import { AmountByCategory } from "@/components/visualizers/charts/SessionPieChart";

type SessionPieChartUiProviderProps = {
  data: AmountByCategory[];
};

const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
  } = props;

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

export const SessionPieChartUiProvider: FC<SessionPieChartUiProviderProps> = (
  props,
) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [fallbackColor] = useState(randomColor());
  const colors = useRecoilValue(tagColors);

  return (
    <ResponsiveContainer width={"100%"} height={180}>
      <PieChart onMouseLeave={() => setActiveIndex(undefined)}>
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
          {props.data.map(({ key }, index) => {
            return (
              <Cell
                fillOpacity={0.4}
                stroke={colors[key] ?? fallbackColor}
                key={`cell-${index}`}
                fill={colors[key] ?? fallbackColor}
              />
            );
          })}
          {activeIndex === undefined && (
            <Label
              value={formatTime(
                props.data.reduce((acc, curr) => acc + curr.value, 0),
              )}
              position="center"
              fill={"#fff"}
            />
          )}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
