import { z } from "zod";

const tagLabelFilter = z.object({
  label: z
    .object({
      value: z.array(z.string()),
      mode: z.union([z.literal("all"), z.literal("some")]),
    }),
});

const tagIdFilter = z.object({
  id: z
    .object({
      value: z.array(z.string()),
      mode: z.union([z.literal("all"), z.literal("some")]),
    }),
});

export const tagFilter = z
  .object({
    ...tagLabelFilter.shape,
    ...tagIdFilter.shape,
  })
  .partial();

export type TagFilter = z.infer<typeof tagFilter>;
