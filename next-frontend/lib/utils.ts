import { TagWithId } from "@kobu-labs/nowaster-js-typing";
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
  const minutes = Math.floor(minutesTotal % 60);

  return `${zeroPad(hours)}:${zeroPad(minutes)}`;
};

export const getFormattedTimeDifference = (from: Date, to: Date) => {
  return formatTime(Math.abs(differenceInMinutes(from, to)));
};

export const randomColor = (): string => {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
};

export const showSelectedTagsFirst = (
  selectedTags: TagWithId[],
  availableTags: TagWithId[]
) => {
  return availableTags.sort((tag1, tag2) => {
    if (selectedTags.some((t) => t.id === tag1.id)) {
      if (selectedTags.some((t) => t.id === tag2.id)) {
        return 0;
      }
      return -1;
    }

    if (selectedTags.some((t) => t.id === tag2.id)) {
      return 1;
    }
    return 0;
  });
};

export function countLeaves(val: any): number {
  if (val === undefined) {
    return 0;
  }
  if (Array.isArray(val)) {
    return val.length > 0 ? 1 : 0;
  }

  if (Object.prototype.toString.call(val) !== "[object Object]") {
    return 1;
  }

  return Object.values(val)
    .map(countLeaves)
    .reduce((a, b) => a + b, 0);
}
