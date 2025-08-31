import { z } from "zod";

const ResponseSuccess = z.object({
  data: z.any(),
  status: z.enum(["success"]),
});

const ResponseFail = z.object({
  message: z.string(),
  status: z.enum(["fail"]),
});

export const ResponseSchema = ResponseFail.or(ResponseSuccess);
