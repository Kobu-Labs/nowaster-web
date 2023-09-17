import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FC, useState } from "react";
import { GetSessionsRequest } from "@/validation/requests/scheduledSession";
import { dateProcessors, Granularity } from "@/lib/session-grouping";
import { OverviewAreaChartProvider } from "./providers/OveriewAreChartProvider";
import { Card, CardContent, CardHeader } from "./ui/card";

type ClampedSessionAreaChartProps = {
  granularity: keyof typeof Granularity,
  filter?: Partial<GetSessionsRequest>
}

export const ClampedSessionAreaChart: FC<ClampedSessionAreaChartProps> = (props) => {
  const [granularity, setGranularity] = useState<keyof typeof Granularity>(props.granularity);
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
          granularity={granularity}
          ticks={Array.from({ length: processor.amount }, (_, i) => i + 1)}
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