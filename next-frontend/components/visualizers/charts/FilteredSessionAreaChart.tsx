import { FC, HTMLAttributes, useState } from "react";
import {
  SessionFilterPrecursor,
  filterPrecursorAtom,
  getDefaultFilter,
  overwriteData,
} from "@/state/chart-filter";
import { Provider, useAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { ArrowRight } from "lucide-react";

import { Granularity } from "@/lib/session-grouping";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components//shadcn/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { DateTimePicker } from "@/components/visualizers/DateTimePicker";
import { ChartFilter } from "@/components/visualizers/charts/ChartFilter";
import { SessionBaseAreaChart } from "@/components/visualizers/charts/SessionBaseAreChart";

type FilteredSessionAreaChartProps = {
  initialGranularity: keyof typeof Granularity;
  filter?: SessionFilterPrecursor;
} & HTMLAttributes<HTMLDivElement>;

export const FilteredSessionAreaChart: FC<FilteredSessionAreaChartProps> = (
  props
) => {
  return (
    <Provider>
      <FilteredSessionAreaChartInner {...props} />
    </Provider>
  );
};

const FilteredSessionAreaChartInner: FC<FilteredSessionAreaChartProps> = (
  props
) => {
  const [granularity, setGranularity] = useState<keyof typeof Granularity>(
    props.initialGranularity
  );

  useHydrateAtoms(
    new Map([[filterPrecursorAtom, props.filter ?? getDefaultFilter()]])
  );

  const [filterPrecursor, setChartFilter] = useAtom(filterPrecursorAtom);

  const updateFromDate = (date: Date | undefined) => {
    setChartFilter((oldState) =>
      overwriteData(oldState, { endTimeFrom: date })
    );
  };

  const updateToDate = (date: Date | undefined) => {
    setChartFilter((oldState) => overwriteData(oldState, { endTimeTo: date }));
  };

  return (
    <Card className={cn("flex grow flex-col", props.className)}>
      <CardHeader className="flex flex-row items-center gap-2">
        <Select
          onValueChange={(val: keyof typeof Granularity) => setGranularity(val)}
        >
          <SelectTrigger className="w-fit">
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
        <div className="grow"></div>
        <div className="flex items-center gap-2">
          <DateTimePicker
            label="From"
            selected={filterPrecursor.data.endTimeFrom}
            onSelect={updateFromDate}
          />
          <ArrowRight />
          <DateTimePicker
            label="To"
            selected={filterPrecursor.data.endTimeTo}
            onSelect={updateToDate}
          />
        </div>
        <ChartFilter />
      </CardHeader>
      <CardContent className="grow">
        <SessionBaseAreaChart
          groupingOpts={{
            granularity: granularity,
            allKeys: true,
          }}
          filter={filterPrecursor}
        />
      </CardContent>
    </Card>
  );
};
