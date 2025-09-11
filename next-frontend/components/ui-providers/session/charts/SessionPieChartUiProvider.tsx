/* eslint-disable  @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
// INFO: this is due to the untyped nature of recharts

"use client";

import type { FC } from "react";
import { useMemo, useState } from "react";
import {
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
} from "recharts";

import type { AmountByCategory } from "@/components/visualizers/sessions/charts/SessionPieChart";
import { formatTime, randomColor } from "@/lib/utils";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import { useIsMobile } from "@/components/shadcn/use-mobile";

interface SessionPieChartUiProviderProps {
  activeIndex?: null | number;
  data: AmountByCategory[];
  onActiveIndexChange?: (index: number | undefined) => void;
}

const renderActiveShape = (props: PieSectorDataItem) => {
  const {
    cx,
    cy,
    endAngle,
    fill,
    innerRadius,
    outerRadius,
    payload,
    startAngle,
  } = props;

  return (
    <g>
      <text dy={0} fill={fill} textAnchor="middle" x={cx} y={cy}>
        {payload.key}
      </text>
      <text dy={19} fill={fill} textAnchor="middle" x={cx} y={cy}>
        {formatTime(payload.value)}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        endAngle={endAngle}
        fill={fill}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
      />
      <Sector
        cx={cx}
        cy={cy}
        endAngle={endAngle}
        fill={fill}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
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
  const isMobile = useIsMobile();

  // Use external activeIndex if provided, otherwise use internal state
  const activeIndex
    = props.activeIndex === undefined
      ? internalActiveIndex
      : (props.activeIndex ?? undefined);

  const [fallbackColor] = useState(randomColor());

  // INFO: compability layer because of rechart v3.x changes
  // see: https://github.com/recharts/recharts/issues/5999,
  // https://github.com/recharts/recharts/issues/5999
  const tooltip = useMemo(() => {
    return (
      <Tooltip active={true} content={() => ""} defaultIndex={activeIndex} />
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
        className="flex items-center justify-center"
        height={180}
        width="100%"
      >
        <div className="flex items-center justify-center text-muted-foreground">
          No sessions
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer height={180} width="100%">
      <PieChart
        onMouseLeave={() => {
          handleActiveIndexChange(undefined);
        }}
      >
        {tooltip}
        <Pie
          activeShape={activeIndex !== undefined && renderActiveShape}
          cx="50%"
          cy="50%"
          // @ts-expect-error  INFO: this is just wrong
          data={props.data}
          dataKey="value"
          innerRadius={60}
          nameKey="key"
          onClick={(_, i) =>
            isMobile
            && handleActiveIndexChange(i === activeIndex ? undefined : i)}
          onMouseEnter={(_, i) => handleActiveIndexChange(i)}
          outerRadius={80}
          paddingAngle={5}
        >
          {props.data.map(({ metadata }, index) => {
            return (
              <Cell
                fill={metadata.color ?? fallbackColor}
                fillOpacity={0.4}
                key={`cell-${index}`}
                stroke={metadata.color ?? fallbackColor}
              />
            );
          })}
          {activeIndex === undefined && (
            <Label
              fill="#fff"
              position="center"
              value={formatTime(
                props.data.reduce((acc, curr) => acc + curr.value, 0),
              )}
            />
          )}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
