import { z } from "zod";

export const timerRecordedSchema = z
  .object({
    startTime: z.coerce.date(),
    category: z.string().nonempty("Category must not be empty"),
    description: z.string().optional(),
    userId: z.string(),
  });

export const timerRecordedFormSchema = z
  .object({
    category: z.string().nonempty("Category must not be empty"),
    description: z.string().optional(),
  });


export type TimerRecordedSubmit = z.infer<typeof timerRecordedSchema>;
export type TimerRecordedFormSubmit = z.infer<typeof timerRecordedFormSchema>;
