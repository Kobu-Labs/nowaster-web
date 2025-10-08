import type { CategoryWithId } from "@/api/definitions/models/category";
import type { SessionTemplate } from "@/api/definitions/models/session-template";
import type { TagDetails } from "@/api/definitions/models/tag";
import type {
  CategoryFilter,
  DateFilter,
  DurationFilter,
  FilterSession,
  TagFilter,
  TemplateFilter,
  UserFilter,
} from "./filter";

/**
 * Filter mode determining how multiple values are combined
 */
export type FilterMode = "all" | "any";

/**
 * Filter settings - describes **how** to filter (logic), not the actual values
 */
export type FilterSettings = {
  user?: {
    mode: FilterMode;
  };
  category?: {
    mode: FilterMode;
  };
  tag?: {
    mode: FilterMode;
    noTag?: boolean;
  };
  template?: {
    mode: FilterMode;
    noTemplate?: boolean;
  };
  startTime?: {
    operator: "gte" | "gt" | "lte" | "lt" | "eq";
  };
  endTime?: {
    operator: "gte" | "gt" | "lte" | "lt" | "eq";
  };
  duration?: {
    operator: "gte" | "gt" | "lte" | "lt" | "eq";
  };
};

/**
 * Filter data - holds the actual entities/values to filter by
 */
export type FilterData = {
  users?: string[];
  categories?: CategoryWithId[];
  tags?: TagDetails[];
  templates?: SessionTemplate[];
  startTime?: Date;
  endTime?: Date;
  duration?: number; // in minutes
};

/**
 * Filter precursor - combines settings and data for easy manipulation in UI
 */
export type FilterPrecursor = {
  settings: FilterSettings;
  data: FilterData;
};

/**
 * Default filter settings
 */
export const defaultFilterSettings: FilterSettings = {
  category: {
    mode: "any",
  },
  tag: {
    mode: "any",
    noTag: false,
  },
  template: {
    mode: "any",
    noTemplate: false,
  },
  user: {
    mode: "any",
  },
};

/**
 * Default filter data
 */
export const defaultFilterData: FilterData = {
  categories: [],
  tags: [],
  templates: [],
  users: [],
};

/**
 * Default filter precursor
 */
export const defaultFilterPrecursor: FilterPrecursor = {
  data: defaultFilterData,
  settings: defaultFilterSettings,
};

/**
 * Convert FilterPrecursor to FilterSession (backend format)
 */
export const convertToFilterSession = (
  precursor: FilterPrecursor,
): FilterSession => {
  const { settings, data } = precursor;
  const filter: FilterSession = {};

  // User filter
  if (settings.user && data.users && data.users.length > 0) {
    const userFilter: UserFilter = {};
    if (data.users.length === 1) {
      userFilter.id = data.users[0];
    } else {
      userFilter.id =
        settings.user.mode === "all"
          ? { all: data.users }
          : { any: data.users };
    }
    filter.user = userFilter;
  }

  // Category filter
  if (settings.category && data.categories && data.categories.length > 0) {
    const categoryFilter: CategoryFilter = {};
    const categoryIds = data.categories.map((c) => c.id);
    if (categoryIds.length === 1) {
      categoryFilter.id = categoryIds[0];
    } else {
      categoryFilter.id =
        settings.category.mode === "all"
          ? { all: categoryIds }
          : { any: categoryIds };
    }
    filter.category = categoryFilter;
  }

  // Tag filter
  if (settings.tag) {
    if (settings.tag.noTag) {
      filter.tag = "notag" as TagFilter;
    } else if (data.tags && data.tags.length > 0) {
      const tagIds = data.tags.map((t) => t.id);
      if (tagIds.length === 1) {
        filter.tag = { id: tagIds[0] };
      } else {
        filter.tag = {
          id: settings.tag.mode === "all" ? { all: tagIds } : { any: tagIds },
        };
      }
    }
  }

  // Template filter
  if (settings.template) {
    if (settings.template.noTemplate) {
      filter.template = "no_template" as TemplateFilter;
    } else if (data.templates && data.templates.length > 0) {
      const templateIds = data.templates.map((t) => t.id);
      if (templateIds.length === 1) {
        filter.template = { id: templateIds[0] };
      } else {
        filter.template = {
          id:
            settings.template.mode === "all"
              ? { all: templateIds }
              : { any: templateIds },
        };
      }
    }
  }

  // Start time filter
  if (settings.startTime && data.startTime) {
    const operator = settings.startTime.operator;
    filter.start_time = { [operator]: data.startTime } as DateFilter;
  }

  // End time filter
  if (settings.endTime && data.endTime) {
    const operator = settings.endTime.operator;
    filter.end_time = { [operator]: data.endTime } as DateFilter;
  }

  // Duration filter
  if (settings.duration && data.duration !== undefined) {
    const operator = settings.duration.operator;
    filter.duration = { [operator]: data.duration } as DurationFilter;
  }

  return filter;
};

/**
 * Helper: Toggle tag selection
 */
export const toggleTag = (
  precursor: FilterPrecursor,
  tag: TagDetails,
): FilterPrecursor => {
  const tags = precursor.data.tags || [];
  const exists = tags.find((t) => t.id === tag.id);

  return {
    ...precursor,
    data: {
      ...precursor.data,
      tags: exists ? tags.filter((t) => t.id !== tag.id) : [...tags, tag],
    },
  };
};

/**
 * Helper: Toggle category selection
 */
export const toggleCategory = (
  precursor: FilterPrecursor,
  category: CategoryWithId,
): FilterPrecursor => {
  const categories = precursor.data.categories || [];
  const exists = categories.find((c) => c.id === category.id);

  return {
    ...precursor,
    data: {
      ...precursor.data,
      categories: exists
        ? categories.filter((c) => c.id !== category.id)
        : [...categories, category],
    },
  };
};

/**
 * Helper: Toggle template selection
 */
export const toggleTemplate = (
  precursor: FilterPrecursor,
  template: SessionTemplate,
): FilterPrecursor => {
  const templates = precursor.data.templates || [];
  const exists = templates.find((t) => t.id === template.id);

  return {
    ...precursor,
    data: {
      ...precursor.data,
      templates: exists
        ? templates.filter((t) => t.id !== template.id)
        : [...templates, template],
    },
  };
};

/**
 * Helper: Toggle user selection
 */
export const toggleUser = (
  precursor: FilterPrecursor,
  userId: string,
): FilterPrecursor => {
  const users = precursor.data.users || [];
  const exists = users.includes(userId);

  return {
    ...precursor,
    data: {
      ...precursor.data,
      users: exists ? users.filter((u) => u !== userId) : [...users, userId],
    },
  };
};

/**
 * Helper: Change filter mode for a specific filter type
 */
export const changeFilterMode = (
  precursor: FilterPrecursor,
  filterType: "user" | "category" | "tag" | "template",
  mode: FilterMode,
): FilterPrecursor => {
  return {
    ...precursor,
    settings: {
      ...precursor.settings,
      [filterType]: {
        ...precursor.settings[filterType],
        mode,
      },
    },
  };
};

/**
 * Helper: Toggle noTag flag
 */
export const toggleNoTag = (precursor: FilterPrecursor): FilterPrecursor => {
  return {
    ...precursor,
    settings: {
      ...precursor.settings,
      tag: {
        ...precursor.settings.tag,
        mode: precursor.settings.tag?.mode || "any",
        noTag: !precursor.settings.tag?.noTag,
      },
    },
  };
};

/**
 * Helper: Toggle noTemplate flag
 */
export const toggleNoTemplate = (
  precursor: FilterPrecursor,
): FilterPrecursor => {
  return {
    ...precursor,
    settings: {
      ...precursor.settings,
      template: {
        ...precursor.settings.template,
        mode: precursor.settings.template?.mode || "any",
        noTemplate: !precursor.settings.template?.noTemplate,
      },
    },
  };
};

const test: FilterPrecursor = {
  settings: {
    endTime: {
      operator: "gt",
    },
    category: {
      mode: "all",
    },
  },
  data: {
    endTime: new Date(),
    categories: [],
  },
};
