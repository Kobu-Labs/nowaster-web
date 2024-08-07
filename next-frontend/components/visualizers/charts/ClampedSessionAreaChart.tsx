import { FC, useState } from "react";
import { SessionFilterPrecursor } from "@/state/chart-filter";

import { Granularity, dateProcessors } from "@/lib/session-grouping";
import { Card, CardContent, CardHeader } from "@/components/shadcn/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { SessionBaseAreaChart } from "@/components/visualizers/charts/SessionBaseAreChart";

type ClampedSessionAreaChartProps = {
  initialGranularity: keyof typeof Granularity;
  filter?: SessionFilterPrecursor;
};

export const ClampedSessionAreaChart: FC<ClampedSessionAreaChartProps> = (
  props
) => {
  const [granularity, setGranularity] = useState<keyof typeof Granularity>(
    props.initialGranularity
  );
  const processor = dateProcessors[granularity];

  return (
    <Card>
      <CardHeader>
        <Select
          onValueChange={(val: keyof typeof Granularity) => setGranularity(val)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={Granularity[granularity]} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup defaultChecked>
              {Object.entries(Granularity).map(([key, val]) => (
                <SelectItem
                  key={key}
                  disabled={key === granularity}
                  value={key}
                >
                  {val}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <SessionBaseAreaChart
          groupingOpts={{ granularity: granularity, allKeys: true }}
          filter={{
            data: {
              ...props.filter?.data,
              endTimeTo: processor.end(),
              endTimeFrom: processor.start(),
            },
            settings: props.filter?.settings ?? {},
          }}
        />
      </CardContent>
    </Card>
  );
};
