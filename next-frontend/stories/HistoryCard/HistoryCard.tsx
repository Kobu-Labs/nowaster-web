import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScheduledSession } from "@/validation/models"
import { differenceInMilliseconds } from "date-fns"
import { FC } from "react"
import { SessionTag } from "../SessionTag/SessionTag"


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

type HistoryCardProps = {
  session: ScheduledSession,
  hideBorder?: boolean
}

export const HistoryCard: FC<HistoryCardProps> = ({ session, hideBorder }) => {
  return (
    <Card className={(hideBorder ? "border-hidden" : "border border-input") + " hover:bg-accent hover:text-accent-foreground hover:cursor-pointer"}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">
          {session.category}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex grow-0">
        <div>
          <p className="text-muted-foreground text-sm">{session.description}</p>
          <div className="mt-1 flex" >
            {session.tags.map((val) => <SessionTag key={val.id} value={val.label}></SessionTag>)}
          </div>
        </div>
        <div className="grow" />
        <div className="ml-4 font-medium">{formatTimeDiff(session.startTime, session.endTime)}</div>
      </CardContent>
    </Card>
  )
}
