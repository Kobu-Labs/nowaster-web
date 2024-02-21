import { z } from "zod";
import { TagSchema } from "./tagRequests";
import { HasID } from "./utils";

export const createScheduledSchema = z.object({
  category: z.string().nonempty(),
  description: z.string()
    .max(50)
    .nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  tags: z.array(TagSchema.merge(HasID)),
});

export const readByUserScheduledSchema = z.object({
  userId: z.string().uuid(),
});

export const readByIdScheduledSchema = z.object({
  id: z.string().uuid(),
});

export const readManyScheduledSchema = z.object({
  limit: z.coerce.number().optional(),
  fromStartTime: z.coerce.date().optional(),
  toStartTime: z.coerce.date().optional(),
  fromEndTime: z.coerce.date().optional(),
  toEndTime: z.coerce.date().optional(),
  category: z.string().optional(),
  /* TODO: Allow for multiple tags being passed here*/
  tags: z.string().optional()
});

export const updateScheduledSchema = z.object({
  id: z.string().uuid(),
  category: z.string().nonempty().optional(),
  description: z.string()
    .max(50)
    .optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  tags: z.array(z.string()),
});


export const deleteScheduledSchema = z.object({
  id: z.string().uuid(),
});
