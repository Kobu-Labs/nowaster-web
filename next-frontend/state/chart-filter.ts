import { Category, TagWithId } from "@kobu-labs/nowaster-js-typing";
import { atom } from "jotai";

/*
 * Object describing **how** to do filtering, now **what** is the value of the filter
 */
export type FilterSettings = OmitValue<SessionFilter>;

export type SessionFilter = {
  tags: {
    label: {
      mode: "exact" | "some";
      value: string[];
    };
  };
  category: {
    label: {
      mode: "every" | "some";
      value: string[];
    };
  };
  endTimeFrom: {
    value: Date | undefined;
  };
  endTimeTo: {
    value: Date | undefined;
  };
};

/*
 * Object that will provide the values for filtering
 */
export type FilterValueFiller = {
  tags: TagWithId[];
  categories: Category[];
  endTimeFrom?: Date;
  endTimeTo?: Date;
};

export type SessionFilterPrecursor = {
  filter: FilterSettings;
  data: FilterValueFiller;
};

type OmitValue<T> = T extends object
  ? {
      [K in keyof T as Exclude<K, "value">]: OmitValue<T[K]>;
    }
  : T;

const defaultFilterSettings: FilterSettings = {
  tags: {
    label: {
      mode: "exact",
    },
  },
  category: {
    label: {
      mode: "every",
    },
  },
  endTimeTo: {},
  endTimeFrom: {},
};
const defaultFilterData: FilterValueFiller = {
  tags: [],
  categories: [],
};

// This state is not global and is provided per-filtered-chart basis
export const enrichedChartFilterSate = atom<SessionFilterPrecursor>({
  data: defaultFilterData,
  filter: defaultFilterSettings,
});

export const finalFilterState = atom<Partial<SessionFilter>>((get) => {
  const {
    data,
    filter: { tags, category },
  } = get(enrichedChartFilterSate);

  const result: SessionFilter = {
    tags: {
      label: {
        mode: tags.label.mode,
        value: data.tags?.map((tag) => tag.label) ?? [],
      },
    },
    category: {
      label: {
        mode: category.label.mode,
        value: data.categories?.map((category) => category.name) ?? [],
      },
    },
    endTimeFrom: {
      value: data.endTimeFrom,
    },
    endTimeTo: {
      value: data.endTimeTo,
    },
  };

  return result;
});

export const changeTagFilterMode = (
  oldState: SessionFilterPrecursor,
  mode: "exact" | "some"
): SessionFilterPrecursor => {
  const {
    filter: { tags, ...filterRest },
    data,
  } = oldState ?? {};

  return {
    data,
    filter: {
      ...filterRest,
      tags: {
        ...tags,
        label: {
          mode: mode,
        },
      },
    },
  };
};

export const changeCategoryFilterMode = (
  oldState: SessionFilterPrecursor,
  mode: "every" | "some"
): SessionFilterPrecursor => {
  const {
    filter: { category, ...filterRest },
    data,
  } = oldState ?? {};

  return {
    data,
    filter: {
      ...filterRest,
      category: {
        ...category,
        label: {
          mode: mode,
        },
      },
    },
  };
};

export const overwriteData = (
  oldState: SessionFilterPrecursor,
  newData: Partial<FilterValueFiller>
): SessionFilterPrecursor => {
  const { data, ...rest } = oldState;
  return {
    ...rest,
    data: {
      ...data,
      ...newData,
    },
  };
};

export const overwriteFilter = (
  oldState: SessionFilterPrecursor,
  newFilter: Partial<FilterSettings>
): SessionFilterPrecursor => {
  const { filter, ...rest } = oldState;
  return {
    ...rest,
    filter: {
      ...filter,
      ...newFilter,
    },
  };
};

export const handleSelectTag = (
  oldState: SessionFilterPrecursor,
  tag: TagWithId
): SessionFilterPrecursor => {
  const {
    data: { tags, ...data },
    ...rest
  } = oldState;

  let newTags;
  if (tags.find((t) => t.id === tag.id)) {
    newTags = tags.filter((t) => t.id !== tag.id);
  } else {
    newTags = [tag, ...tags];
  }

  return {
    ...rest,
    data: {
      ...data,
      tags: newTags,
    },
  };
};

export const handleSelectCategory = (
  oldState: SessionFilterPrecursor,
  category: Category
): SessionFilterPrecursor => {
  const {
    data: { categories, ...data },
    ...rest
  } = oldState;

  let newCategories;
  if (categories.find((cat) => cat.name === category.name)) {
    newCategories = categories.filter((cat) => cat.name !== category.name);
  } else {
    newCategories = [category, ...categories];
  }

  return {
    ...rest,
    data: {
      ...data,
      categories: newCategories,
    },
  };
};

export const getDefaultFilterSettings = (): FilterSettings => {
  return defaultFilterSettings;
};

export const getDefaultFilterData = (): FilterValueFiller => {
  return defaultFilterData;
};

export const resetFilterFull = (): SessionFilterPrecursor => {
  return {
    data: defaultFilterData,
    filter: defaultFilterSettings,
  };
};
