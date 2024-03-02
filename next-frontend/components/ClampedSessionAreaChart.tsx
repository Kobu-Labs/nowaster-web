import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FC, useState } from "react";
import { dateProcessors, Granularity } from "@/lib/session-grouping";
import { OverviewAreaChartProvider } from "@/components/providers/OveriewAreChartProvider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScheduledSessionRequest } from "@kobu-labs/nowaster-js-typing";

type ClampedSessionAreaChartProps = {
  initialGranularity: keyof typeof Granularity,
  filter?: Partial<ScheduledSessionRequest["readMany"]>
}

export const ClampedSessionAreaChart: FC<ClampedSessionAreaChartProps> = (props) => {
  const [granularity, setGranularity] = useState<keyof typeof Granularity>(props.initialGranularity);
  const processor = dateProcessors[granularity];

  return (
    <Card>
      <CardHeader>
        <Select onValueChange={(val: keyof typeof Granularity) => setGranularity(val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={Granularity[granularity]} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup defaultChecked>
              {Object.entries(Granularity).map(([key, val]) =>
                <SelectItem key={key} disabled={key === granularity} value={key}>{val}</SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <OverviewAreaChartProvider
          groupingOpts={{ granularity: granularity, allKeys:true}}
          filter={{
            fromEndTime: processor.start(),
            toEndTime: processor.end(),
            ...props.filter,
          }}
        />
      </CardContent>
    </Card>
  );
};
