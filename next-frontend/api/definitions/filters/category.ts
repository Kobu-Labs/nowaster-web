import { z } from "zod";

const categoryNameFilter = z.object({
  name: z
    .object({
      value: z.array(z.string()),
      mode: z.union([z.literal("all"), z.literal("some")]),
    }),
});

const categoryIdFilter = z.object({
  id: z
    .object({
      value: z.array(z.string()),
      mode: z.union([z.literal("all"), z.literal("some")]),
    }),
});

export const categoryFilter = z
  .object({
    ...categoryNameFilter.shape,
    ...categoryIdFilter.shape,
  })
  .partial();

export type CategoryFilter = z.infer<typeof categoryFilter>;
