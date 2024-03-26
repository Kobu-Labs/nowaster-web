import * as process from "process";
import { Result } from "@badrap/result";
import { ResponseSchema } from "@kobu-labs/nowaster-js-typing";
import axios from "axios";
import { ZodType } from "zod";

const baseApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:4001",
  validateStatus: () => true,
});

export const handleResponse = async <T>(
  data: any,
  schema: ZodType<T>
): Promise<Result<T>> => {
  const request = await ResponseSchema.safeParseAsync(data);
  if (!request.success) {
    return Result.err(new Error("Response is of unexpected structure!"));
  }

  if (request.data.status === "fail") {
    return Result.err(new Error("Request failed!"));
  }

  const requestBody = await schema.safeParseAsync(request.data.data);
  if (!requestBody.success) {
    return Result.err(
      new Error("Parsing data failed!\n" + requestBody.error.message)
    );
  }

  return Result.ok(requestBody.data);
};

export default baseApi;
