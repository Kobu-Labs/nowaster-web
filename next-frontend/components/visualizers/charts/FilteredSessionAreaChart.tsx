import { FC, HTMLAttributes, useState } from "react";
import {
  Granularity,
  GranularitySelect,
} from "@/components/visualizers/charts/GranularitySelect";
import {
  SessionFilterPrecursor,
  filterPrecursorAtom,
  getDefaultFilter,
  overwriteData,
} from "@/state/chart-filter";
import { Provider, useAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components//shadcn/card";
import { ChartFilter } from "@/components/visualizers/charts/ChartFilter";
import { SessionBaseAreaChart } from "@/components/visualizers/charts/SessionBaseAreChart";
import { GranularityBasedDatePicker } from "@/components/ui-providers/date-pickers/GranularityBasedDatePicker";
import { DeepRequired } from "react-hook-form";
import { DateRange } from "react-day-picker";

type FilteredSessionAreaChartProps = {
  initialGranularity: Granularity;
  filter?: SessionFilterPrecursor;
} & HTMLAttributes<HTMLDivElement>;

export const FilteredSessionAreaChart: FC<FilteredSessionAreaChartProps> = (
  props,
) => {
  return (
    <Provider>
      <FilteredSessionAreaChartInner {...props} />
    </Provider>
  );
};

const FilteredSessionAreaChartInner: FC<FilteredSessionAreaChartProps> = (
  props,
) => {
  const [granularity, setGranularity] = useState<Granularity>(
    props.initialGranularity,
  );

  useHydrateAtoms(
    new Map([[filterPrecursorAtom, props.filter ?? getDefaultFilter()]]),
  );

  const [filterPrecursor, setChartFilter] = useAtom(filterPrecursorAtom);

  const updateFilter = (range: DeepRequired<DateRange>) => {
    setChartFilter((oldState) =>
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
              initialDate: filterPrecursor.data.endTimeTo?.value,
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
          filter={filterPrecursor}
        />
      </CardContent>
    </Card>
  );
};
