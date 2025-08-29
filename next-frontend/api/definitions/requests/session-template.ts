import { RecurringSessionIntervalSchema } from "@/api/definitions/models/session-template";
import { templateSessionsActionSchema } from "@/components/visualizers/sessions/templates/form/form-schemas";
import { z } from "zod";

const create = z.object({
  name: z.string().trim().min(1),
  interval: RecurringSessionIntervalSchema,
  start_date: z.coerce.date<Date>(),
  end_date: z.coerce.date<Date>(),
  sessions: z.array(
    z.object({
      category_id: z.string(),
      tag_ids: z.array(z.string()),
      start_minute_offset: z.number(),
      end_minute_offset: z.number(),
      description: z.string().optional(),
    }),
  ),
});

const update = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  interval: RecurringSessionIntervalSchema,
  start_date: z.coerce.date<Date>(),
  end_date: z.coerce.date<Date>(),
  sessions: z.array(
    z.object({
      category_id: z.string(),
      tag_ids: z.array(z.string()),
      start_minute_offset: z.number(),
      end_minute_offset: z.number(),
      description: z.string().optional(),
    }),
  ),
});

const deleteTemplate = z.object({
  id: z.string().uuid(),
  existingSessionActions: templateSessionsActionSchema,
});

const deleteRecurringSession = z.object({
  id: z.string().uuid(),
});

const readMany = z.null();

export type SessionTemplateRequest = {
  [Property in keyof typeof SessionTemplateRequestSchema]: z.infer<
    (typeof SessionTemplateRequestSchema)[Property]
  >;
};

export const SessionTemplateRequestSchema = {
  create,
  update,
  readMany,
  deleteTemplate,
  deleteRecurringSession,
} as const;
