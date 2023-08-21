import { z } from "zod";
import { RecordedEntity, RecordedSessionSchema } from "../models";
import { HasID } from "../utils";


export const createRecordedSchema = RecordedSessionSchema

export const readManyRecordedSchema = z.object({
  limit: z.coerce.number().optional()
})

export const readByIdRecordedSchema = z.object({
  id: z.string().uuid(),
});

export const updateRecordedSchema = RecordedSessionSchema.partial().merge(HasID)

export const deleteRecordedSchema = z.object({
  id: z.string().uuid(),
});
