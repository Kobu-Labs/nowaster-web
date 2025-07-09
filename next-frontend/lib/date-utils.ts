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

// Sunday -> 6, Monday -> 0
export const normalizeDayNumber = (day: number): number => {
  return (day + 6) % 7;
};

export const getDaytimeAfterDate = (
  lowerBoundDate: Date,
  interval: RecurringSessionInterval,
  time: { minutes: number; hours: number; day: number },
): Date => {
  const adjustedDate = set(lowerBoundDate, {
    hours: time.hours,
    minutes: time.minutes,
    seconds: 0,
    milliseconds: 0,
  });

  const dailyHandler = () => {
    // check if we are within the same interval and day
    if (adjustedDate >= lowerBoundDate) {
      return adjustedDate;
    }
    return incrementByInterval(interval, adjustedDate);
  };

  const weeklyHandler = () => {
    const lowerBoundDay = normalizeDayNumber(lowerBoundDate.getDay());
    const targetDay = normalizeDayNumber(time.day);
    // amount of days it takes to get from `lowerBoundDay` to `targetDay`
    const dayDifference = (targetDay - lowerBoundDay + 7) % 7;

    const result = addDays(adjustedDate, dayDifference);
    if (result >= lowerBoundDate) {
      return result;
    }

    return incrementByInterval(interval, result);
  };

  switch (interval) {
  case "daily": {
    return dailyHandler();
  }
  case "weekly": {
    return weeklyHandler();
  }
  }
};
