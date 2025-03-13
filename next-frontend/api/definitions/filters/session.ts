import { categoryFilter } from "@/api/definitions/filters/category";
import { dateFilter } from "@/api/definitions/filters/date";
import { tagFilter } from "@/api/definitions/filters/tag";
import { z } from "zod";

export const sessionFilter = z.object({
  tags: tagFilter,
  categories: categoryFilter,
  fromStartTime: dateFilter,
  toStartTime: dateFilter,
  fromEndTime: dateFilter,
  toEndTime: dateFilter,
}).partial();

export type SessionFilter = z.infer<typeof sessionFilter>
