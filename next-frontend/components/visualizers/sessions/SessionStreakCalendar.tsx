import { cva } from "class-variance-authority";
import { addDays, isSameDay, subDays } from "date-fns";
import { DayContent, DayContentProps } from "react-day-picker";

import { Calendar } from "@/components/shadcn/calendar";
import { Card, CardContent } from "@/components/shadcn/card";

export const dayCellVariants = cva(
  "m-[2px] inline-flex h-9 w-9 hover:cursor-pointer items-center justify-center rounded-3xl  p-0 text-sm font-normal",
  {
    variants: {
      variant: {
        default: "hover:bg-accent hover:text-accent-foreground",
        active: "border hover:bg-pink-400 border-2 border-pink-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type SessionStreakCalendarProps = {
  sessionsDates: Date[]
}

export const SessionStreakCalendar = ({
  sessionsDates: sessions,
}: SessionStreakCalendarProps) => {
  function StreakCalculator(props: DayContentProps) {
    // TODO: not very performance friendly
    const isActiveDay = sessions.some((x) => isSameDay(x, props.date));
    const isNextDayActive = sessions.some((x) =>
      isSameDay(addDays(props.date, 1), x),
    );
    const isPreviousDayActive = sessions.some((x) =>
      isSameDay(subDays(props.date, 1), x),
    );

    return (
      <div
        className={dayCellVariants({
          variant: isActiveDay ? "active" : "default",
        })}
      >
        {isNextDayActive && isActiveDay && (
          <div className=" absolute right-0 top-1/2 h-1 w-[3px] bg-pink-500"></div>
        )}
        <DayContent {...props} />
        {isPreviousDayActive && isActiveDay && (
          <div className=" absolute left-0 top-1/2 h-1 w-[3px] bg-pink-500"></div>
        )}
      </div>
    );
  }

  return (
    <Card className="inline-flex">
      <CardContent>
        <Calendar
          components={{ DayContent: StreakCalculator }}
          classNames={{
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 focus-visible:ring-ring ring-offset-background inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          }}
        />
      </CardContent>
    </Card>
  );
};
