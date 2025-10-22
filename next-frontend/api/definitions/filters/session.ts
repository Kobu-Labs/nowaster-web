import { categoryFilter } from "@/api/definitions/filters/category";
import { dateFilter } from "@/api/definitions/filters/date";
import { tagFilter } from "@/api/definitions/filters/tag";
import { z } from "zod";

export const sessionFilter = z.object({
  categories: categoryFilter,
  fromEndTime: dateFilter,
  fromStartTime: dateFilter,
  tags: tagFilter,
  toEndTime: dateFilter,
  toStartTime: dateFilter,
}).partial();

export type SessionFilter = z.infer<typeof sessionFilter>;
