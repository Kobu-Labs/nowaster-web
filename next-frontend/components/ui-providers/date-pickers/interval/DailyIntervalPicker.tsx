import { FC } from "react";
import { Button } from "@/components/shadcn/button";
import { ScrollArea, ScrollBar } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import { cn, zeroPad } from "@/lib/utils";

const toggleOrientation = (orientation: "horizontal" | "vertical") => {
  return orientation === "horizontal" ? "vertical" : "horizontal";
};

type DailyIntervalPickerProps = {
  onSelect: (value: { day: number; hours: number; minutes: number }) => void;
  selected?: { day: number; hours: number; minutes: number };
  orientation?: "horizontal" | "vertical";
};

export const DailyIntervalPicker: FC<DailyIntervalPickerProps> = (props) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const orientation = props.orientation ?? "vertical";

  return (
    <div
      className={cn(
        "flex w-full",
        orientation === "horizontal" && "flex-col ",
        orientation === "vertical" && "flex-row ",
      )}
    >
      <ScrollArea>
        <div
          className={cn(
            "flex p-2 gap-1",
            orientation === "horizontal" && "flex-row items-center w-[300px]",
            orientation === "vertical" && "flex-col h-[300px] items-center",
          )}
        >
          <div className="relative">
            <p className="top-0 text-muted-foreground sticky">HH</p>
          </div>
          <Separator orientation={toggleOrientation(orientation)} />
          {hours.map((hour) => (
            <Button
              key={hour}
              size="icon"
              type="button"
              className="shrink-0 aspect-square"
              variant={props.selected?.hours === hour ? "default" : "ghost"}
              onClick={() =>
                props.onSelect({
                  hours: hour,
                  minutes: props.selected?.minutes ?? 0,
                  day: props.selected?.day ?? 0,
                })
              }
            >
              {zeroPad(hour)}
            </Button>
          ))}
        </div>
        <ScrollBar orientation={orientation} />
      </ScrollArea>
      <ScrollArea>
        <div
          className={cn(
            "flex p-2 gap-1",
            orientation === "horizontal" && "flex-row items-center w-[300px]",
            orientation === "vertical" && "flex-col items-center h-[300px]",
          )}
        >
          <p className="text-muted-foreground">MM</p>
          <Separator orientation={toggleOrientation(orientation)} />
          {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
            <Button
              key={minute}
              size="icon"
              type="button"
              className="shrink-0 aspect-square"
              variant={props.selected?.minutes === minute ? "default" : "ghost"}
              onClick={() =>
                props.onSelect({
                  minutes: minute,
                  hours: props.selected?.hours ?? 0,
                  day: props.selected?.day ?? 0,
                })
              }
            >
              {minute.toString().padStart(2, "0")}
            </Button>
          ))}
        </div>
        <ScrollBar orientation={orientation} />
      </ScrollArea>
    </div>
  );
};
