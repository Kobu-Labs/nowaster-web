import { RecurringSessionIntervalSchema } from "@/api/definitions/models/session-template";
import { recurringSessionPrecursor } from "@/components/visualizers/sessions/templates/form/RecurringSessionForm";
import { z } from "zod";

export const templateSessionsActionSchema = z.enum([
  "delete-all",
  "delete-future",
  "keep-all",
]);

export const templateSessionPrecursorSchema = z.object({
  name: z.string().trim().min(1),
  interval: RecurringSessionIntervalSchema,
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  sessions: z.array(recurringSessionPrecursor),
});

export type TemplateSessionPrecursor = z.infer<
  typeof templateSessionPrecursorSchema
>;
export type TemplateSessionsAction = z.infer<
  typeof templateSessionsActionSchema
>;
