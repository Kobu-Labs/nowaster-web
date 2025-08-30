// INFO: this is due to the untyped nature of recharts
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import { FC, useMemo, useState } from "react";
import {
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
} from "recharts";

import { AmountByCategory } from "@/components/visualizers/sessions/charts/SessionPieChart";
import { formatTime, randomColor } from "@/lib/utils";

type SessionPieChartUiProviderProps = {
  data: AmountByCategory[];
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | undefined) => void;
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
  const [internalActiveIndex, setInternalActiveIndex] = useState<
    number | undefined
  >(undefined);

  // Use external activeIndex if provided, otherwise use internal state
  const activeIndex =
    props.activeIndex !== undefined
      ? (props.activeIndex ?? undefined)
      : internalActiveIndex;

  const [fallbackColor] = useState(randomColor());

  // INFO: compability layer because of rechart v3.x changes
  // see: https://github.com/recharts/recharts/issues/5999,
  // https://github.com/recharts/recharts/issues/5999
  const tooltip = useMemo(() => {
    return (
      <Tooltip defaultIndex={activeIndex} active={true} content={() => ""} />
    );
  }, [activeIndex]);


  const handleActiveIndexChange = (index: number | undefined) => {
    if (props.onActiveIndexChange) {
      props.onActiveIndexChange(index);
    } else {
      setInternalActiveIndex(index);
    }
  };

  if (props.data.length === 0) {
    return (
      <ResponsiveContainer
        width={"100%"}
        height={180}
        className="flex items-center justify-center"
      >
        <div className="flex items-center justify-center text-muted-foreground">
          No sessions
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width={"100%"} height={180}>
      <PieChart onMouseLeave={() => handleActiveIndexChange(undefined)}>
        {tooltip}
        <Pie
          data={props.data}
          dataKey="value"
          nameKey="key"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          activeShape={activeIndex !== undefined && renderActiveShape}
          onMouseEnter={(_, i) => handleActiveIndexChange(i)}
        >
          {props.data.map(({ metadata }, index) => {
            return (
              <Cell
                fillOpacity={0.4}
                stroke={metadata.color ?? fallbackColor}
                key={`cell-${index}`}
                fill={metadata.color ?? fallbackColor}
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
