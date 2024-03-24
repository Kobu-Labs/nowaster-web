"use client"

import React, { FC } from "react"
import { CalendarIcon } from "@radix-ui/react-icons"
import { addMinutes } from "date-fns"
import { X } from "lucide-react"
import { DateTime } from "luxon"
import { Label } from "recharts"

import { Button } from "@/components/shadcn/button"
import { Calendar } from "@/components/shadcn/calendar"
import { Input } from "@/components/shadcn/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover"

export type QuickOption = {
  label: string
  increment: (date: Date) => Date
}

type DatePickerDemoProps = {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  quickOptions?: QuickOption[]
}

export const DateTimePicker: FC<DatePickerDemoProps> = (props) => {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { value } = e.target
    const datetime = DateTime.fromJSDate(props.selected || new Date())
    const hours = Number.parseInt(value.split(":")[0] || "00", 10)
    const minutes = Number.parseInt(value.split(":")[1] || "00", 10)
    const modifiedDay = datetime.set({ hour: hours, minute: minutes })
    props.onSelect(modifiedDay.toJSDate())
  }

  return (
    <Popover>
      <div className="flex items-center rounded-md border border-input">
        {props.selected && (
          <div
            onClick={() => props.onSelect(undefined)}
            className="cursor-pointer rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            <X />
          </div>
        )}
        <PopoverTrigger
          onWheel={(e) =>
            props.onSelect(
              addMinutes(props.selected || new Date(), e.deltaY > 0 ? -1 : 1)
            )
          }
          asChild
        >
          <div className="inline-flex w-full cursor-pointer  items-center gap-2 rounded-md p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ">
            <CalendarIcon className="h-4 w-4" />
            {props.selected ? (
              DateTime.fromJSDate(props.selected).toFormat("DDD HH:mm")
            ) : (
              <span>Pick a date</span>
            )}
          </div>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0">
        <Calendar
          weekStartsOn={1}
          mode="single"
          selected={props.selected}
          onSelect={(v) => v && props.onSelect(v)}
          initialFocus
        />
        <div className="px-4 pb-4 pt-0">
          <Label>Time</Label>
          <Input
            type="time"
            onChange={handleChange}
            value={
              props.selected
                ? DateTime.fromJSDate(props.selected).toFormat("HH:mm")
                : "Nothing"
            }
          />
        </div>
      </PopoverContent>
      <div className="flex gap-1">
        {props.quickOptions?.map((val) => (
          <Button
            className="block h-min p-1"
            key={val.label}
            variant={"secondary"}
            type="button"
            onClick={() =>
              props.onSelect(val.increment(props.selected || new Date()))
            }
          >
            {val.label}
          </Button>
        ))}
      </div>
    </Popover>
  )
}
