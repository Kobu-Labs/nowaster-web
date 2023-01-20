import { differenceInMilliseconds } from "date-fns"
import { FC } from "react"
import { SessionTag } from "../SessionTag/SessionTag"

type ScheduledSession = {
  userId: string,
  tags: string[],
  startTime: Date,
  endTime: Date,
  category: string,
  description: string,
}

const formatTimeUnit = (unit: number): string => {
  return (unit < 10 ? "0" : "") + unit.toString()
}

const formatTimeDiff = (startTime: Date, endTime: Date): string => {
  const secondsRaw = differenceInMilliseconds(endTime, startTime) / 1000
  const hours = Math.floor(secondsRaw / 3600)
  const minutes = Math.floor(secondsRaw / 60) % 60
  const seconds = Math.floor(secondsRaw % 60)

  return `${formatTimeUnit(hours)}:${formatTimeUnit(minutes)}:${formatTimeUnit(seconds)}`
}

type HistoryCardProps = ScheduledSession

export const HistoryCard: FC<HistoryCardProps> = (props) => {
  return (
      <div className="flex items-center">
        <span className="h-9 w-9">H</span>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">{props.category}</p>
          <p className="text-muted-foreground text-sm">{props.description}</p>
          <div className="flex">{props.tags.map((val) => <SessionTag value={val}></SessionTag>
          )}</div>
        </div>
        <div className="mb-16 ml-auto font-medium">{formatTimeDiff(props.startTime, props.endTime)}</div>
      </div>
  )
}
