import z from "zod";

const taskIdFilter = z.object({
  id: z.object({
    mode: z.union([z.literal("all"), z.literal("some")]),
    value: z.array(z.string()),
  }),
});

export const taskFilter = z
  .object({
    ...taskIdFilter.shape,
  })
  .partial();
