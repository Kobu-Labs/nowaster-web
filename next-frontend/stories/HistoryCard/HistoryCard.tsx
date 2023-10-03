import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ScheduledSession } from "@/validation/models";
import { cva, VariantProps } from "class-variance-authority";
import { differenceInMilliseconds } from "date-fns";
import { FC } from "react";
import { SessionTag } from "../SessionTag/SessionTag";


const formatTimeUnit = (unit: number): string => {
  return (unit < 10 ? "0" : "") + unit.toString();
};

const formatTimeDiff = (startTime: Date, endTime: Date): string => {
  const secondsRaw = differenceInMilliseconds(endTime, startTime) / 1000;
  const hours = Math.floor(secondsRaw / 3600);
  const minutes = Math.floor(secondsRaw / 60) % 60;
  const seconds = Math.floor(secondsRaw % 60);

  return `${formatTimeUnit(hours)}:${formatTimeUnit(minutes)}:${formatTimeUnit(seconds)}`;
};

type HistoryCardProps = {
  session: ScheduledSession,
} & VariantProps<typeof historyCardVariants>

const historyCardVariants = cva(
  "hover:bg-accent hover:text-accent-foreground hover:cursor-pointer",
  {
    variants: {
      variant: {
        default: "border border-input",
        borderless: "border-hidden",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const HistoryCard: FC<HistoryCardProps> = (props) => {
  return (
    <Card className={cn(historyCardVariants({ variant: props.variant }))}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">
          {props.session.category}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex grow-0">
        <div>
          <p className="text-muted-foreground text-sm">{props.session.description}</p>
          <div className="mt-1 flex" >
            {props.session.tags.map((val) => <SessionTag key={val.id} value={val.label}></SessionTag>)}
          </div>
        </div>
        <div className="grow" />
        <div className="ml-4 font-medium">{formatTimeDiff(props.session.startTime, props.session.endTime)}</div>
      </CardContent>
    </Card>
  );
};
