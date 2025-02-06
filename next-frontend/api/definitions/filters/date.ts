import { z } from "zod";

export const dateFilter = z.object({
  value: z.coerce.date().optional(),
});
