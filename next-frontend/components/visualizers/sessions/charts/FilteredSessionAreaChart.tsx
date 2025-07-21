import { SessionFilterPrecursor, overwriteData } from "@/state/chart-filter";
import { FC, HTMLAttributes, useState } from "react";

import { Card, CardContent, CardHeader } from "@/components//shadcn/card";
import { useChartFilter } from "@/components/hooks/use-chart-filter";
import { GranularityBasedDatePicker } from "@/components/ui-providers/date-pickers/GranularityBasedDatePicker";
import { ChartFilter } from "@/components/visualizers/sessions/charts/ChartFilter";
import {
  Granularity,
  GranularitySelect,
} from "@/components/visualizers/sessions/charts/GranularitySelect";
import { SessionBaseAreaChart } from "@/components/visualizers/sessions/charts/SessionBaseAreChart";
import { FilterContextProvider } from "@/components/visualizers/sessions/SessionFilterContextProvider";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { DeepRequired } from "react-hook-form";

type FilteredSessionAreaChartProps = {
  initialGranularity: Granularity;
  filter?: SessionFilterPrecursor;
} & HTMLAttributes<HTMLDivElement>;

export const FilteredSessionAreaChart: FC<FilteredSessionAreaChartProps> = (
  props,
) => {
  return (
    <FilterContextProvider initialFilter={props.filter}>
      <FilteredSessionAreaChartInner
        initialGranularity={props.initialGranularity}
      />
    </FilterContextProvider>
  );
};

const FilteredSessionAreaChartInner: FC<FilteredSessionAreaChartProps> = (
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
    <Card className={cn("flex grow flex-col", props.className)}>
      <CardHeader className="flex flex-row items-center gap-2">
        <GranularitySelect
          onSelect={setGranularity}
          defaultValue={granularity}
        />
        <div className="grow"></div>
        <div className="flex items-center gap-2">
          <GranularityBasedDatePicker
            granularity={granularity}
            props={{
              onSelected: updateFilter,
            }}
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
          filter={filter}
        />
      </CardContent>
    </Card>
  );
};
