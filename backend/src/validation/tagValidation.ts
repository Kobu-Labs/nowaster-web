import { z } from "zod";

export const createTagSchema = z.object({
  label: z.string()
});
