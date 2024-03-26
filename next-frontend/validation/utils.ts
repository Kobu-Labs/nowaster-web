import { z } from "zod";

export const userNameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .regex(/^\w+$/, "Username must contain only alphanumeric characters");

export const HasID = z.object({ id: z.string() });
