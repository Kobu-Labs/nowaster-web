import { SessionFilterPrecursor } from "@/state/chart-filter";
import { SessionFilter, TagDetails } from "@/api/definitions";
import { clsx, type ClassValue } from "clsx";
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
  return (
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")
  );
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
    return 0;
  });
};

export function countLeaves(obj: any): number {
  const isObject = (val: any): val is object => typeof val === "object";

  const isTruthy = (val: any) => {
    if (Array.isArray(val) && val.length === 0) return false;
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
    settings: { tags, categories },
  } = precursor;

  const result: SessionFilter = {};

  if (data.endTimeTo?.value) {
    result.toEndTime = {
      value: data.endTimeTo.value,
    };
  }

  if (data.endTimeFrom?.value) {
    result.fromEndTime = {
      value: data.endTimeFrom.value,
    };
  }

  if (data.tags && data.tags?.length > 0) {
    result.tags = result.tags ?? {};
    result.tags.label = {
      mode: tags?.label?.mode ?? "some",
      value: data.tags?.map((tag) => tag.label) ?? [],
    };
  }

  if (data.categories && data.categories?.length > 0) {
    result.categories = result.categories ?? {};
    result.categories.name = {
      mode: categories?.name?.mode ?? "some",
      value: data.categories?.map((category) => category.name) ?? [],
    };
  }

  return result;
};

export const emptyStringToUndefined = (
  value: string | undefined | null,
  options?: { trim?: boolean },
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
