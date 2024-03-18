import { FC, HTMLAttributes, useState } from "react"
import { ScheduledSessionRequest } from "@kobu-labs/nowaster-js-typing"

import { Granularity } from "@/lib/session-grouping"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components//shadcn/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select"
import { DateTimePicker } from "@/components/visualizers/DateTimePicker"
import { SessionBaseAreaChart } from "@/components/visualizers/charts/SessionBaseAreChart"

type FilteredSessionAreaChartProps = {
  initialGranularity: keyof typeof Granularity
  filter?: Partial<ScheduledSessionRequest["readMany"]>
} & HTMLAttributes<HTMLDivElement>

export const FilteredSessionAreaChart: FC<FilteredSessionAreaChartProps> = (
  props
) => {
  const [granularity, setGranularity] = useState<keyof typeof Granularity>(
    props.initialGranularity
  )

  const [fromTime, setFromTime] = useState<Date | undefined>()
  const [toTime, setToTime] = useState<Date | undefined>()

  return (
    <Card className={cn("flex flex-col grow", props.className)}>
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
        <p>From:</p>
        <DateTimePicker selected={fromTime} onSelect={setFromTime} />
        <p>To:</p>
        <DateTimePicker selected={toTime} onSelect={setToTime} />
      </CardHeader>
      <CardContent className="grow">
        <SessionBaseAreaChart
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
  )
}
