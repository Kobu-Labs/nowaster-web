import { z } from "zod";


export const createRecordedSchema = z.object({
  category: z.string().nonempty(),
  description: z.string()
    .max(50)
    .nullable(),
  startTime: z.coerce.date()
});


export const readByIdRecordedSchema = z.object({
  id: z.string().uuid(),
});

export const updateRecordedSchema = z.object({
  id: z.string().uuid(),
  category: z.string().nonempty().optional(),
  description: z.string()
    .max(50)
    .optional(),
  startTime: z.coerce.date().optional()
});


export const deleteRecordedSchema = z.object({
  id: z.string().uuid(),
});
