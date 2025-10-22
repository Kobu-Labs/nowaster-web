import type {
  CategoryWithId,
  ScheduledSessionRequest,
  TagDetails,
} from "@/api/definitions";

/*
 * Object describing **how** to do filtering, not **what** is the value of the filter
 */
export type FilterSettings = NonNullable<OmitValue<SessionFilter>>;

/*
 * Object that will provide the values for filtering
 */
export type FilterValueFiller = {
  categories?: CategoryWithId[];
  endTimeFrom?: { value: Date; };
  endTimeTo?: { value: Date; };
  tags?: TagDetails[];
};

export type SessionFilter = ScheduledSessionRequest["readMany"];

export type SessionFilterPrecursor = {
  data: FilterValueFiller;
  settings: FilterSettings;
};

type OmitValue<T> = T extends object
  ? {
      [K in keyof T as Exclude<K, "value">]: OmitValue<T[K]>;
    }
  : T;

const defaultFilterSettings: FilterSettings = {
  categories: {
    name: {
      mode: "some",
    },
  },
  tags: {
    label: {
      mode: "some",
    },
  },
};
const defaultFilterData: FilterValueFiller = {
  categories: [],
  tags: [],
};

export const changeTagFilterMode = (
  oldState: SessionFilterPrecursor,
  mode: "all" | "some",
): SessionFilterPrecursor => {
  const {
    data,
    settings: { tags, ...filterRest },
  } = oldState || {};

  return {
    data,
    settings: {
      ...filterRest,
      tags: {
        ...tags,
        label: {
          mode,
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
    data,
    settings: { categories, ...filterRest },
  } = oldState ?? {};

  return {
    data,
    settings: {
      ...filterRest,
      categories: {
        ...categories,
        name: {
          mode,
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
    data: {
      ...oldState.data,
      ...newData,
    },
    settings: oldState.settings,
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
