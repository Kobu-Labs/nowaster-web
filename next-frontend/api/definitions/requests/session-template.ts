import { RecurringSessionIntervalSchema } from "@/api/definitions/models/session-template";
import { z } from "zod";

const create = z.object({
  name: z.string().trim().min(1),
  interval: RecurringSessionIntervalSchema,
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
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

const readMany = z.null();

export type SessionTemplateRequest = {
  [Property in keyof typeof SessionTemplateRequestSchema]: z.infer<
    (typeof SessionTemplateRequestSchema)[Property]
  >;
};

export const SessionTemplateRequestSchema = {
  create,
  readMany,
} as const;
