import { ScheduledSessionApi } from "@/api"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScheduledSession } from "@/validation/models"
import { useQuery } from "@tanstack/react-query"
import { addDays, addMonths, differenceInMinutes, getDate, getDay, getDaysInMonth, getMonth, startOfMonth, startOfWeek, startOfYear } from "date-fns"
import { FC, useState } from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"


export type Granularity = "week" | "month" | "year"

const dateProcessors: {
  [K in Granularity]: {
    amount: number,
    key: (value: Date) => string,
    start: Date,
    next: (value: Date) => Date,
  }
} = {
  week: {
    start: startOfWeek(Date.now()),
    next: value => addDays(value, 1),
    amount: 7,
    key: (value: Date) => (1 + getDay(value)).toString()
  },
  month: {
    start: startOfMonth(Date.now()),
    next: value => addDays(value, 1),
    amount: getDaysInMonth(Date.now()),
    key: (value: Date) => getDate(value).toString()
  },
  year: {
    start: startOfYear(Date.now()),
    next: value => addMonths(value, 1),
    amount: 12,
    key: (value: Date) => (getMonth(value) + 1).toString()
  }
} as const

type SessionsByCategory = { [category: string]: string } & { granularity: string }

const preprocessData = (processor: typeof dateProcessors[keyof typeof dateProcessors], data: (ScheduledSession & { id: string })[]): SessionsByCategory[] => {
  let processed = data.reduce((value: { [granularity: string]: { [category: string]: number } }, item) => {
    const key = processor.key(item.endTime)
    if (!value[key]) {
      value[key] = {}
    }
    if (!value[key][item.category]) {
      value[key][item.category] = 0
    }

    value[key][item.category] += differenceInMinutes(item.endTime, item.startTime)
    return value
  }, {})


  return Object.entries(processed).map(([k, v]) => {
    return { granularity: k, ...v }
  })
}

type OverviewChartProps = {
  granularity: Granularity,
}


export const OverviewAreaChart: FC<OverviewChartProps> = (props) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sessions"],
    retry: false,
    queryFn: async () => await ScheduledSessionApi.getSessions(),
  });
  const [granularity, setGranularity] = useState<Granularity>(props.granularity)

  if (isLoading || isError) {
    return <div >Something bad happenned</div>
  }

  if (data.isErr) {
    return <div>{data.error.message}</div>
  }
  const processor = dateProcessors[granularity]
  const processed = preprocessData(processor, data.value)
  const uniqueCategories = Array.from(new Set(data.value.map(x => x.category)))

  const colors: { [category: string]: string } = {}
  uniqueCategories.forEach((category) => colors[category] = "#" + Math.floor(Math.random() * 16777215).toString(16))
  console.log(processed)

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>Overview Per Category</CardTitle>
          <Select onValueChange={(a: Granularity) => { setGranularity(a) }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="year">Past year</SelectItem>
                <SelectItem value="month">Past month</SelectItem>
                <SelectItem value="week">Past week</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent >
        <ResponsiveContainer width={"100%"} height={250} >
          <AreaChart data={processed}>
            <XAxis ticks={Array.from({ length: processor.amount }, (_, i) => i + 1)} type="number" interval={0} domain={[1, processor.amount]} dataKey="granularity" />
            <YAxis />
            <Tooltip content={(data) => customTooltip(data, colors)} />
            {uniqueCategories.map(category => {
              /* BUG:  color switching - implement fix later */
              return (<Area key={category} fill={colors[category]} type="monotone" stackId="1" dataKey={(v) => v[category] || 0} stroke={colors[category]} strokeWidth={4} fillOpacity={0.4} />)
            })}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

const customTooltip = (data: any, colors: any) => {
  console.log(data)
  if (!data.payload) {
    return <div />
  }
  const values = data.payload[0]?.payload

  /* BUG: tailwind classes cannot be computed dynamically - use style prop to set a variable, use the variable inside the className prop*/
  return values
    ? <div className="rounded-sm p-2">
      {Object.entries(values).map(([k, v]) => {
        if (k !== "granularity") {
          return <p className={`text-[${colors[k]}]`}>{`${k}:${v}`}</p>
        }
      })}
    </div>
    : < div />
}
