import type { SessionFilterPrecursor } from "@/state/chart-filter";
import type { SessionFilter, TagDetails } from "@/api/definitions";
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
  return `#${Math.floor(Math.random() * 0xFF_FF_FF)
    .toString(16)
    .padStart(6, "0")}`;
};

export const isHexColor = (str: string) => /^#([0-9A-F]{3}){2}$/i.test(str);

export const showSelectedTagsFirst = (
  selectedTags: TagDetails[],
  availableTags: TagDetails[],
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
    return tag2.last_used_at.getTime() - tag1.last_used_at.getTime();
  });
};

export function countLeaves(obj: any): number {
  const isObject = (val: any): val is object => typeof val === "object";

  const isTruthy = (val: any) => {
    if (Array.isArray(val) && val.length === 0) {
      return false;
    }
    return Boolean(val);
  };

  const countValues = (obj: unknown): number => {
    if (!isObject(obj)) {
      return 0;
    }

    return Object.entries(obj).reduce((count, [key, value]) => {
      // Check if the key is 'value' and the value is truthy
      const keyCount = key === "value" && isTruthy(value) ? 1 : 0;
      return count + keyCount + countValues(value);
    }, 0);
  };

  return countValues(obj);
}

export const translateFilterPrecursor = (
  precursor?: SessionFilterPrecursor,
): Partial<SessionFilter> => {
  if (!precursor) {
    return {};
  }
  const {
    data,
    settings: { categories, tags },
  } = precursor;

  const filter: SessionFilter = {};

  if (data.endTimeTo?.value) {
    filter.toEndTime = {
      value: data.endTimeTo.value,
    };
  }

  if (data.endTimeFrom?.value) {
    filter.fromEndTime = {
      value: data.endTimeFrom.value,
    };
  }

  if (data.tags && data.tags?.length > 0) {
    filter.tags = filter.tags ?? {};
    if (tags?.id?.mode) {
      filter.tags.id = {
        mode: tags.id.mode,
        value: data.tags?.map((tag) => tag.id) ?? [],
      };
    }
    if (tags?.label?.mode) {
      filter.tags.label = {
        mode: tags.label.mode,
        value: data.tags?.map((tag) => tag.label) ?? [],
      };
    }
  }

  if (data.categories && data.categories.length > 0) {
    filter.categories = filter.categories ?? {};
    filter.categories.name = {
      mode: categories?.name?.mode ?? "some",
      value: data.categories?.map((category) => category.name) ?? [],
    };
  }

  return filter;
};

export const emptyStringToUndefined = (
  value: null | string | undefined,
  options?: { trim?: boolean; },
): string | undefined => {
  let workingValue = value;
  if (options?.trim) {
    workingValue = value?.trim();
  }

  if (workingValue === "" || workingValue === null) {
    return undefined;
  }

  return workingValue;
};

export const arrayFromUndefined = <T>(value?: null | T) => {
  if (!value) {
    return [];
  }
  return [value];
};

export const toggleOrientation = (orientation: "horizontal" | "vertical") => {
  return orientation === "horizontal" ? "vertical" : "horizontal";
};

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();
};
