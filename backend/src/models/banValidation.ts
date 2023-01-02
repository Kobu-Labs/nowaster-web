import { z } from "zod";

export const createBanSchema = z.object({ 
  userId: z.string().uuid(),
  endTime: z.coerce.date().nullable()
});

export const readBanSchema = z.object({
  userId: z.string().uuid(),
});