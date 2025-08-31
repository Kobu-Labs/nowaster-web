import { overwriteData } from "@/state/chart-filter";
import type { FC, HTMLAttributes } from "react";
import { useState } from "react";

import { Card, CardContent, CardHeader } from "@/components//shadcn/card";
import { useChartFilter } from "@/components/hooks/use-chart-filter";
import { GranularityBasedDatePicker } from "@/components/ui-providers/date-pickers/GranularityBasedDatePicker";
import { ChartFilter } from "@/components/visualizers/sessions/charts/ChartFilter";
import type {
  Granularity } from "@/components/visualizers/sessions/charts/GranularitySelect";
import {
  GranularitySelect,
} from "@/components/visualizers/sessions/charts/GranularitySelect";
import { SessionBaseAreaChart } from "@/components/visualizers/sessions/charts/SessionBaseAreChart";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import type { DeepRequired } from "react-hook-form";

type FilteredSessionAreaChartProps = {
  initialGranularity: Granularity;
} & HTMLAttributes<HTMLDivElement>;

export const FilteredSessionAreaChart: FC<FilteredSessionAreaChartProps> = (
  props,
) => {
  const [granularity, setGranularity] = useState(props.initialGranularity);

  const { filter, setFilter } = useChartFilter();

  const updateFilter = (range: DeepRequired<DateRange>) => {
    setFilter((oldState) =>
      overwriteData(oldState, {
        endTimeFrom: { value: range.from },
        endTimeTo: { value: range.to },
      }),
    );
  };

  return (
    <Card className={cn("flex flex-col w-full", props.className)}>
      <CardHeader className="md:hidden self-end">
        <ChartFilter />
      </CardHeader>
      <CardHeader className="hidden md:flex flex-row items-center gap-2 space-y-0">
        <GranularitySelect
          defaultValue={granularity}
          onSelect={setGranularity}
        />
        <div className="grow"></div>
        <GranularityBasedDatePicker
          granularity={granularity}
          props={{
            onSelected: updateFilter,
          }}
        />
        <ChartFilter />
      </CardHeader>
      <CardContent className="grow">
        <SessionBaseAreaChart
          filter={filter}
          groupingOpts={{
            allKeys: true,
            granularity,
          }}
        />
      </CardContent>
    </Card>
  );
};
