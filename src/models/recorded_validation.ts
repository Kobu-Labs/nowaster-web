import { z } from "zod";


export const createRecordedSchema = z.object({
  userId: z.string().uuid(),
  category: z.string().nonempty(),
  description: z.string()
    .max(50)
    .optional()
    .transform(x => x ? x : null),
  startTime: z.string().pipe(z.coerce.date())
});

export const readRecordedSchema = z.object({
  userId: z.string().uuid(),
});

export const readByIdRecordedSchema = z.object({
  userId: z.string().uuid(),
  id: z.string().uuid(),
});

export const updateRecordedSchema = z.object({
  id: z.string().uuid(),
  category: z.string().nonempty().optional(),
  description: z.string()
    .max(50)
    .optional(),
  startTime: z.string().pipe(z.coerce.date()).optional()
});


export const deleteRecordedSchema = z.object({
  id: z.string().uuid(),
});
