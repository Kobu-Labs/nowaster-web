import { FC, HTMLAttributes, createContext, useState } from "react";
import { ScheduledSessionRequest } from "@kobu-labs/nowaster-js-typing";
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
import { FilterSettings } from "@/components/visualizers/charts/FilterSettings";
import { SessionBaseAreaChart } from "@/components/visualizers/charts/SessionBaseAreChart";

type FilteredSessionAreaChartProps = {
  initialGranularity: keyof typeof Granularity
  filter?: Partial<ScheduledSessionRequest["readMany"]>
} & HTMLAttributes<HTMLDivElement>

type SessionFilterType = {
  setFilter: (filter: ScheduledSessionRequest["readMany"]) => void
} & { filter: ScheduledSessionRequest["readMany"] }

export const SessionFilterContext = createContext<
  SessionFilterType | undefined
>(undefined);

export const FilteredSessionAreaChart: FC<FilteredSessionAreaChartProps> = (
  props
) => {
  const [granularity, setGranularity] = useState<keyof typeof Granularity>(
    props.initialGranularity
  );
  const [filter, setFilter] = useState<ScheduledSessionRequest["readMany"]>({});

  const ctx: SessionFilterType = {
    setFilter: setFilter,
    filter: filter,
  };

  const updateFromDate = (date: Date | undefined) => {
    const { fromEndTime, ...rest } = filter;
    setFilter({ fromEndTime: date, ...rest });
  };
  const updateToDate = (date: Date | undefined) => {
    const { toEndTime, ...rest } = filter;
    setFilter({ toEndTime: date, ...rest });
  };

  return (
    <SessionFilterContext.Provider value={ctx}>
      <Card className={cn("flex grow flex-col", props.className)}>
        <CardHeader className="flex flex-row items-center gap-2">
          <Select
            onValueChange={(val: keyof typeof Granularity) =>
              setGranularity(val)
            }
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
              selected={filter.fromEndTime}
              onSelect={updateFromDate}
            />
            <ArrowRight />
            <DateTimePicker
              label="To"
              selected={filter.toEndTime}
              onSelect={updateToDate}
            />
          </div>
          <FilterSettings />
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
    </SessionFilterContext.Provider>
  );
};
