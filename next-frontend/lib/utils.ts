import { type ClassValue, clsx } from "clsx";
import { differenceInMinutes } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const zeroPad = (timeUnit: number): string => {
  if (timeUnit === 0) {
    return "00";
  }

  if (timeUnit <= 9) {
    return `0${timeUnit}`;
  }

  return timeUnit.toString();
};

export const formatTime = (minutesTotal: number) => {
  const hours = Math.floor(minutesTotal / 60);
  const minutes = (minutesTotal % 60);

  return `${zeroPad(hours)}:${zeroPad(minutes)}`;
};

export const getFormattedTimeDifference = (from: Date, to: Date) => {
  return formatTime(Math.abs(differenceInMinutes(from, to)));
};

export const randomColor = (): string => {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
};
