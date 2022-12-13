import { z } from "zod";

export const timerSchema = z
  .object({
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    category: z.string().nonempty("Category must not be empty"),
    description: z.string().optional(),
    userId: z.string(),
  })
  .refine((data) => new Date(data.startTime) < new Date(data.endTime), {
    message: "End time must be after start time!",
    path: ["endTime"],
  });

export type timerSubmit = z.infer<typeof timerSchema>;
