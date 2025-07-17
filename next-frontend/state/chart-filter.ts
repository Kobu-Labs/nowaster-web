import {
  CategoryWithId,
  ScheduledSessionRequest,
  TagDetails,
} from "@/api/definitions";

/*
 * Object describing **how** to do filtering, not **what** is the value of the filter
 */
export type FilterSettings = NonNullable<OmitValue<SessionFilter>>;

export type SessionFilter = ScheduledSessionRequest["readMany"];

/*
 * Object that will provide the values for filtering
 */
export type FilterValueFiller = {
  tags?: TagDetails[];
  categories?: CategoryWithId[];
  endTimeFrom?: { value: Date };
  endTimeTo?: { value: Date };
};

export type SessionFilterPrecursor = {
  settings: FilterSettings;
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
      mode: "some",
    },
  },
  categories: {
    name: {
      mode: "some",
    },
  },
};
const defaultFilterData: FilterValueFiller = {
  tags: [],
  categories: [],
};

export const changeTagFilterMode = (
  oldState: SessionFilterPrecursor,
  mode: "some" | "all",
): SessionFilterPrecursor => {
  const {
    settings: { tags, ...filterRest },
    data,
  } = oldState ?? {};

  return {
    data,
    settings: {
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
  mode: "all" | "some",
): SessionFilterPrecursor => {
  const {
    settings: { categories, ...filterRest },
    data,
  } = oldState ?? {};

  return {
    data,
    settings: {
      ...filterRest,
      categories: {
        ...categories,
        name: {
          mode: mode,
        },
      },
    },
  };
};

export const overwriteData = (
  oldState: SessionFilterPrecursor,
  newData: Partial<FilterValueFiller>,
): SessionFilterPrecursor => {
  return {
    settings: oldState.settings,
    data: {
      ...oldState.data,
      ...newData,
    },
  };
};

export const overwriteFilter = (
  oldState: SessionFilterPrecursor,
  newFilter: Partial<FilterSettings>,
): SessionFilterPrecursor => {
  const { settings: filter, ...rest } = oldState;
  return {
    ...rest,
    settings: {
      ...filter,
      ...newFilter,
    },
  };
};

export const handleSelectTag = (
  oldState: SessionFilterPrecursor,
  tag: TagDetails,
): SessionFilterPrecursor => {
  const {
    data: { tags = [], ...data },
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
  category: CategoryWithId,
): SessionFilterPrecursor => {
  const {
    data: { categories = [], ...data },
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

export const defaultFilter: SessionFilterPrecursor = {
  data: defaultFilterData,
  settings: defaultFilterSettings,
};
