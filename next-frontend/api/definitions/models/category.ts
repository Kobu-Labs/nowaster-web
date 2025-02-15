import { z } from "zod";

export const CategorySchema = z.object({
  name: z.string().trim().min(1),
});

export type Category = z.infer<typeof CategorySchema>
