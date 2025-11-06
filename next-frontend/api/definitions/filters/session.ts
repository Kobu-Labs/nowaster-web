import { categoryFilter } from "@/api/definitions/filters/category";
import { dateFilter } from "@/api/definitions/filters/date";
import { tagFilter } from "@/api/definitions/filters/tag";
import { z } from "zod";

export const sessionFilter = z.object({
  categories: categoryFilter,
  fromEndTime: dateFilter,
  fromStartTime: dateFilter,
  project_id: z.string().uuid().nullish(),
  tags: tagFilter,
  task_id: z.string().uuid().nullish(),
  toEndTime: dateFilter,
  toStartTime: dateFilter,
}).partial();

export type SessionFilter = z.infer<typeof sessionFilter>;
