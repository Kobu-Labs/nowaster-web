import { categoryFilter } from "@/api/definitions/filters/category";
import { dateFilter } from "@/api/definitions/filters/date";
import { tagFilter } from "@/api/definitions/filters/tag";
import { taskFilter } from "@/api/definitions/filters/task";
import { z } from "zod";

export const sessionFilter = z
  .object({
    categories: categoryFilter,
    fromEndTime: dateFilter,
    fromStartTime: dateFilter,
    projectId: z.string().uuid().nullish(),
    tags: tagFilter,
    tasks: taskFilter,
    toEndTime: dateFilter,
    toStartTime: dateFilter,
  })
  .partial();

export type SessionFilter = z.infer<typeof sessionFilter>;
