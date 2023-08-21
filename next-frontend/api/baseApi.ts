import { ResponseSchema } from "@/validation/responses/base";
import { Result } from "@badrap/result";
import axios from "axios";
import { ZodType } from "zod";

const baseApi = axios.create({
  baseURL: "http://localhost:4000",
  validateStatus: () => true,
});

export const handleResponse = async <T>(data: any, schema: ZodType<T>): Promise<Result<T>> => {
  const test = await ResponseSchema.safeParseAsync(data)
  if (!test.success) {
    return Result.err(new Error("Response is of unexpected structure!"))
  }

  if (test.data.status === "fail") {
    return Result.err(new Error("Request failed!"))
  }

  const parsed = await schema.safeParseAsync(test.data)
  if (!parsed.success) {
    return Result.err(new Error("Parsing data failed!"))
  }

  return Result.ok(parsed.data)
}

export default baseApi;
