import { z } from "zod";

export const createScheduledSchema = z.object({
  category: z.string().nonempty({ message: "category cannot be empty" }),
  description: z.string()
    .max(50)
    .optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  tags: z.array(z.string()),
});

export const readByUserScheduledSchema = z.object({
  limit: z.coerce.number().optional()
});

export const updateScheduledSchema = z.object({
  id: z.string().uuid(),
  category: z.string().nonempty().optional(),
  description: z.string()
    .max(50)
    .optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional()
});


export const deleteScheduledSchema = z.object({
  id: z.string().uuid(),
});
