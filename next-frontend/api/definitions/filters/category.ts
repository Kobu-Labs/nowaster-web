import { z } from "zod";

const categoryNameFilter = z.object({
  name: z
    .object({
      mode: z.union([z.literal("all"), z.literal("some")]),
      value: z.array(z.string()),
    }),
});

const categoryIdFilter = z.object({
  id: z
    .object({
      mode: z.union([z.literal("all"), z.literal("some")]),
      value: z.array(z.string()),
    }),
});

export const categoryFilter = z
  .object({
    ...categoryNameFilter.shape,
    ...categoryIdFilter.shape,
  })
  .partial();

export type CategoryFilter = z.infer<typeof categoryFilter>;
