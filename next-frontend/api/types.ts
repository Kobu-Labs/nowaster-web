import { createRecordedSchema, deleteRecordedSchema, readByIdRecordedSchema, readManyRecordedSchema } from "@/validation/requests/recordedSession";
import { createScheduledSchema, deleteScheduledSchema, readByUserScheduledSchema, updateScheduledSchema } from "@/validation/requests/scheduledSession";
import { z } from "zod";

export interface ResponseSingle<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

export interface ResponseMulti<T> {
  data: T[];
  status: 'success' | 'error';
  message?: string;
}

export type DeleteRecordedSessionRequest = z.infer<typeof deleteRecordedSchema>;
export type CreateRecordedSessionRequest = z.infer<typeof createRecordedSchema>;
export type ReadRecordedSessionByIdRequest = z.infer<typeof readByIdRecordedSchema>;
export type ReadManyRecordedSessionsRequest = z.infer<typeof readManyRecordedSchema>;

export type CreateScheduledEntity = z.infer<typeof createScheduledSchema>;
export type GetByUserScheduledEntityData = z.infer<typeof readByUserScheduledSchema>;
export type UpdateScheduledEntityParams = z.infer<typeof updateScheduledSchema>;
export type DeleteSingleScheduledParams = z.infer<typeof deleteScheduledSchema>;
