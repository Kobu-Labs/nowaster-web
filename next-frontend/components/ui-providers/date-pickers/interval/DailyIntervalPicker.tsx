import type { FC } from "react";
import { Button } from "@/components/shadcn/button";
import { ScrollArea, ScrollBar } from "@/components/shadcn/scroll-area";
import { Separator } from "@/components/shadcn/separator";
import { cn, toggleOrientation, zeroPad } from "@/lib/utils";

export interface DailyIntervalPickerProps {
  onSelect: (value: { day: number; hours: number; minutes: number; }) => void;
  orientation?: "horizontal" | "vertical";
  selected?: { day: number; hours: number; minutes: number; };
}

export const DailyIntervalPicker: FC<DailyIntervalPickerProps> = (props) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const orientation = props.orientation ?? "vertical";

  return (
    <div
      className={cn(
        "flex w-full",
        orientation === "horizontal" && "flex-col",
        orientation === "vertical" && "flex-row",
      )}
    >
      <ScrollArea>
        <div
          className={cn(
            "flex p-2 gap-1",
            orientation === "horizontal"
            && "flex-row items-center w-full max-w-[300px]",
            orientation === "vertical" && "flex-col h-[300px] items-center",
          )}
        >
          <div className="relative">
            <p className="top-0 text-white sticky">HH</p>
          </div>
          {hours.map((hour) => (
            <Button
              className="shrink-0 aspect-square text-muted-foreground hover:text-white"
              key={hour}
              onClick={() =>
              { props.onSelect({
                day: props.selected?.day ?? 0,
                hours: hour,
                minutes: props.selected?.minutes ?? 0,
              }); }}
              size="icon"
              type="button"
              variant={props.selected?.hours === hour ? "default" : "ghost"}
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
            orientation === "horizontal"
            && "flex-row items-center w-full max-w-[300px]",
            orientation === "vertical" && "flex-col items-center h-[300px]",
          )}
        >
          <p className="text-white">MM</p>
          <Separator orientation={toggleOrientation(orientation)} />
          {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
            <Button
              className="shrink-0 aspect-square text-muted-foreground hover:text-white"
              key={minute}
              onClick={() =>
              { props.onSelect({
                day: props.selected?.day ?? 0,
                hours: props.selected?.hours ?? 0,
                minutes: minute,
              }); }}
              size="icon"
              type="button"
              variant={props.selected?.minutes === minute ? "default" : "ghost"}
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
