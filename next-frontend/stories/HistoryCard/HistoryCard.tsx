import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { differenceInMilliseconds } from "date-fns"
import { FC } from "react"
import { SessionTag } from "../SessionTag/SessionTag"


// TODO replace this by the actual study session type - missing tags
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

type HistoryCardProps = {
  session: ScheduledSession,
  hideBorder?: boolean
}

export const HistoryCard: FC<HistoryCardProps> = ({ session, hideBorder }) => {
  return (
    <Card className={hideBorder ? "border-hidden" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">
          {session.category}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex grow-0">
        <div>
          <p className="text-muted-foreground text-sm">{session.description}</p>
          <div className="mt-1 flex" >
            {session.tags.map((val) => <SessionTag value={val}></SessionTag>)}
          </div>
        </div>
        <div className="ml-auto font-medium">{formatTimeDiff(session.startTime, session.endTime)}</div>
      </CardContent>
    </Card>
  )
}
