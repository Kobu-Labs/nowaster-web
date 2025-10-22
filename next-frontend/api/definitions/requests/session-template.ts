import { RecurringSessionIntervalSchema } from "@/api/definitions/models/session-template";
import { templateSessionsActionSchema } from "@/components/visualizers/sessions/templates/form/form-schemas";
import { z } from "zod";

const create = z.object({
  end_date: z.coerce.date<Date>(),
  interval: RecurringSessionIntervalSchema,
  name: z.string().trim().min(1),
  sessions: z.array(
    z.object({
      category_id: z.string(),
      description: z.string().optional(),
      end_minute_offset: z.number(),
      start_minute_offset: z.number(),
      tag_ids: z.array(z.string()),
    }),
  ),
  start_date: z.coerce.date<Date>(),
});

const update = z.object({
  end_date: z.coerce.date<Date>(),
  id: z.uuid(),
  interval: RecurringSessionIntervalSchema,
  name: z.string().trim().min(1),
  sessions: z.array(
    z.object({
      category_id: z.string(),
      description: z.string().optional(),
      end_minute_offset: z.number(),
      start_minute_offset: z.number(),
      tag_ids: z.array(z.string()),
    }),
  ),
  start_date: z.coerce.date<Date>(),
});

const deleteTemplate = z.object({
  existingSessionActions: templateSessionsActionSchema,
  id: z.uuid(),
});

const deleteRecurringSession = z.object({
  id: z.uuid(),
});

const readMany = z.null();

export type SessionTemplateRequest = {
  [Property in keyof typeof SessionTemplateRequestSchema]: z.infer<
    (typeof SessionTemplateRequestSchema)[Property]
  >;
};

export const SessionTemplateRequestSchema = {
  create,
  deleteRecurringSession,
  deleteTemplate,
  readMany,
  update,
} as const;
