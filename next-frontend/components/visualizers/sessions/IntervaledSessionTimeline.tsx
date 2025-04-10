import { Card, CardContent, CardHeader } from "@/components/shadcn/card";
import { Separator } from "@/components/shadcn/separator";
import { DateTimePicker } from "@/components/visualizers/DateTimePicker";
import { SessionTimeline } from "@/components/visualizers/sessions/SessionTimeline";
import { subHours } from "date-fns";
import { ArrowBigRight, RotateCcw } from "lucide-react";
import { FC, useState } from "react";

type IntervaledSessionTimelineProps = {
  startDate?: Date;
  endDate?: Date;
};

export const IntervaledSessionTimeline: FC<IntervaledSessionTimelineProps> = (
  props,
) => {
  const [startDate, setStartDate] = useState<Date>(
    props.startDate ?? subHours(new Date(), 48),
  );
  const [endDate, setEndDate] = useState<Date>(props.endDate ?? new Date());

  return (
    <Card>
      <CardHeader>
        <div className="flex w-fit items-center justify-between gap-2 pt-2 pl-2">
          <DateTimePicker
            selected={startDate}
            onSelect={(date) =>
              setStartDate(date ?? props.startDate ?? subHours(new Date(), 48))
            }
          />
          <ArrowBigRight className="w-20" />
          <DateTimePicker
            selected={endDate}
            onSelect={(date) => setEndDate(date ?? props.endDate ?? new Date())}
          />
          <RotateCcw
            className="w-20 cursor-pointer text-muted-foreground hover:text-primary"
            onClick={() => {
              setStartDate(props.startDate ?? subHours(new Date(), 48));
              setEndDate(props.endDate ?? new Date());
            }}
          />
        </div>
      </CardHeader>
      <Separator />
      <CardContent>
        <SessionTimeline
          filter={{
            settings: {},
            data: {
              endTimeTo: { value: endDate },
              endTimeFrom: { value: startDate },
            },
          }}
        />
      </CardContent>
    </Card>
  );
};
