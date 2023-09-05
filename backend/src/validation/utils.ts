import { z } from "zod";

export const HasID = z.object({ id: z.string() });
