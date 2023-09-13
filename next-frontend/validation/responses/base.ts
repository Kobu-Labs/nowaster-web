import { z } from "zod";

const ResponseSuccess = z.object({
  status: z.enum(["success"]),
  data: z.any(),
});

const ResponseFail = z.object({
  status: z.enum(["fail"]),
  message: z.string(),
});


export const ResponseSchema = ResponseFail.or(ResponseSuccess);
