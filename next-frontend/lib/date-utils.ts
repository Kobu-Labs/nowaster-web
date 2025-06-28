import { RecurringSessionInterval } from "@/api/definitions/models/session-template";
import { zeroPad } from "@/lib/utils";
import { addDays, addWeeks, format, set } from "date-fns";

export const numberToDay = (value: number): string => {
  switch (value) {
    case 0:
      return "Sunday";
    case 1:
      return "Monday";
    case 2:
      return "Tuesday";
    case 3:
      return "Wednesday";
    case 4:
      return "Thursday";
    case 5:
      return "Friday";
    case 6:
      return "Saturday";
    default:
      throw new Error("Invalid value for day of the week");
  }
};

export const daysOfWeek = [
  { short: "Mon", full: "Monday", value: 1 },
  { short: "Tue", full: "Tuesday", value: 2 },
  { short: "Wed", full: "Wednesday", value: 3 },
  { short: "Thu", full: "Thursday", value: 4 },
  { short: "Fri", full: "Friday", value: 5 },
  { short: "Sat", full: "Saturday", value: 6 },
  { short: "Sun", full: "Sunday", value: 0 },
] as const;

export const formatIntervalPickerLabel = (
  interval: RecurringSessionInterval,
  value:
    | {
        day: number;
        hours: number;
        minutes: number;
      }
    | undefined,
) => {
  if (value === undefined) {
    return "Pick a value";
  }
  switch (interval) {
    case "daily":
      return `${zeroPad(value.hours)}:${zeroPad(value.minutes)}`;
    case "weekly":
      return `${numberToDay(value.day).substring(0, 3)}, ${zeroPad(value.hours)}:${zeroPad(value.minutes)}`;
  }
};

export const format24Hour = (date: Date): string => {
  return format(date, "HH:mm");
};

export const incrementByInterval = (
  interval: RecurringSessionInterval,
  date: Date,
): Date => {
  switch (interval) {
    case "daily":
      return addDays(date, 1);
    case "weekly":
      return addWeeks(date, 1);
  }
};

export const normalizeDayNumber = (day: number): number => {
  return (day + 6) % 7;
};

export const getDaytimeAfterDate = (
  lowerBoundDate: Date,
  interval: RecurringSessionInterval,
  time: { minutes: number; hours: number; day: number },
): Date => {
  const currentDay = lowerBoundDate.getDay();
  const targetDay = time.day;
  const dayDiff =
    normalizeDayNumber(targetDay) - normalizeDayNumber(currentDay);

  const adjustedDate = set(lowerBoundDate, {
    hours: time.hours,
    minutes: time.minutes,
    seconds: 0,
    milliseconds: 0,
  });

  if (adjustedDate >= lowerBoundDate) {
    return adjustedDate;
  }

  // TODO: this check should be replaced by a interval specific-check
  if (dayDiff > 0) {
    return addDays(adjustedDate, dayDiff);
  }

  return incrementByInterval(interval, adjustedDate);
};
