import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FC, useState } from "react";
import { Granularity } from "@/lib/session-grouping";
import { Card, CardContent, CardHeader } from "@/components//ui/card";
import { OverviewAreaChartProvider } from "@/components/providers/OveriewAreChartProvider";
import { DateTimePicker } from "@/stories/DateTimePicker/DateTimePicker";
import { ScheduledSessionRequest } from "@kobu-labs/nowaster-js-typing";

type FilteredAreaChartProps = {
  initialGranularity: keyof typeof Granularity,
  filter?: Partial<ScheduledSessionRequest["readMany"]>
}

export const FilteredAreaChart: FC<FilteredAreaChartProps> = (props) => {
  const [granularity, setGranularity] = useState<keyof typeof Granularity>(props.initialGranularity);

  const [fromTime, setFromTime] = useState<Date | undefined>();
  const [toTime, setToTime] = useState<Date | undefined>();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Select onValueChange={(val: keyof typeof Granularity) => setGranularity(val)}>
          <SelectTrigger className="w-fit">
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
        <div className="grow"></div>
        <p>From:</p>
        <DateTimePicker selected={fromTime} onSelect={setFromTime} />
        <p>To:</p>
        <DateTimePicker selected={toTime} onSelect={setToTime} />
      </CardHeader>
      <CardContent>
        <OverviewAreaChartProvider
          groupingOpts={{
            granularity: granularity,
            allKeys: true,
          }}
          filter={{
            fromEndTime: fromTime,
            toEndTime: toTime,
            ...props.filter,
          }}
        />
      </CardContent>
    </Card>
  );
};
