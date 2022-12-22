
import { z } from "zod";

export const timerScheduledSchema = z
  .object({
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    category: z.string().nonempty("Category must not be empty"),
    description: z.string().optional(),
    userId: z.string(),
  });

export type TimerScheduledSubmit = z.infer<typeof timerScheduledSchema>;
