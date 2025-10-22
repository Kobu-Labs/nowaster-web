import { z } from "zod";

const tagLabelFilter = z.object({
  label: z
    .object({
      mode: z.union([z.literal("all"), z.literal("some")]),
      value: z.array(z.string()),
    }),
});

const tagIdFilter = z.object({
  id: z
    .object({
      mode: z.union([z.literal("all"), z.literal("some")]),
      value: z.array(z.string()),
    }),
});

export const tagFilter = z
  .object({
    ...tagLabelFilter.shape,
    ...tagIdFilter.shape,
  })
  .partial();

export type TagFilter = z.infer<typeof tagFilter>;
