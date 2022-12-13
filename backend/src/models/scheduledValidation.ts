import { z } from "zod";

export const createScheduledSchema = z.object({
  userId: z.string().uuid(),
  category: z.string().nonempty(),
  description: z.string()
    .max(50)
    .nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date()
});

export const readScheduledSchema = z.object({
  userId: z.string().uuid(),
});

export const readByIdScheduledSchema = z.object({
  userId: z.string().uuid(),
  id: z.string().uuid(),
});

export const updateScheduledSchema = z.object({
  id: z.string().uuid(),
  category: z.string().nonempty().optional(),
  description: z.string()
    .max(50)
    .optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date()
});


export const deleteScheduledSchema = z.object({
  id: z.string().uuid(),
});