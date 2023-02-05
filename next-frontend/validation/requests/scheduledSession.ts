import { z } from "zod";

export const createScheduledSchema = z.object({
  category: z.string().nonempty(),
  description: z.string()
    .max(50)
    .nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date()
});

export const readByUserScheduledSchema = z.object({
    limit : z.coerce.number().optional()
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
