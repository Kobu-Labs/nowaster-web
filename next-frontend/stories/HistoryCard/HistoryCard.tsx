import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, getFormattedTimeDifference } from "@/lib/utils";
import { ScheduledSession } from "@/validation/models";
import { cva, VariantProps } from "class-variance-authority";
import { FC } from "react";
import { SessionTag } from "../SessionTag/SessionTag";


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
        <div className="ml-4 font-medium text-xl">{getFormattedTimeDifference(props.session.startTime, props.session.endTime)}</div>
      </CardContent>
    </Card>
  );
};
