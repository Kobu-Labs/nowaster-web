import { useChartFilter } from "@/components/hooks/use-chart-filter";
import { Card, CardContent, CardHeader } from "@/components/shadcn/card";
import { Separator } from "@/components/shadcn/separator";
import { DateTimePicker } from "@/components/visualizers/DateTimePicker";
import { ChartFilter } from "@/components/visualizers/sessions/charts/ChartFilter";
import { SessionTimeline } from "@/components/visualizers/sessions/timeline/SessionTimeline";
import type { FilterValueFiller } from "@/state/chart-filter";
import { overwriteData } from "@/state/chart-filter";
import { ArrowBigRight } from "lucide-react";
import type { FC } from "react";
import { useCallback } from "react";

export const FilteredSessionTimeline: FC = () => {
  const { filter, setFilter } = useChartFilter();

  const setFilterData = useCallback(
    (filler: FilterValueFiller) =>
    { setFilter((oldState) => overwriteData(oldState, filler)); },
    [setFilter],
  );

  return (
    <Card>
      <CardHeader className="md:hidden flex items-center p-2">
        <div className="self-end">
          <ChartFilter />
        </div>
      </CardHeader>
      <CardHeader className="space-y-0 hidden md:flex md:flex-row p-4 items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <DateTimePicker
            onSelect={(val) =>
              val && setFilterData({ endTimeFrom: { value: val } })}
            selected={filter.data.endTimeFrom?.value}
          />
          <ArrowBigRight className="w-20" />
          <DateTimePicker
            onSelect={(val) =>
              val && setFilterData({ endTimeTo: { value: val } })}
            selected={filter.data.endTimeTo?.value}
          />
        </div>
        <ChartFilter />
      </CardHeader>
      <Separator />
      <CardContent className="grow p-0 sm:p-2 md:p-6 pt-0">
        <SessionTimeline filter={filter} />
      </CardContent>
    </Card>
  );
};
