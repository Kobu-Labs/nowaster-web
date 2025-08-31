import { Result } from "@badrap/result";
import { ResponseSchema } from "@/api/definitions";
import axios from "axios";
import type { ZodType } from "zod";
import { env } from "@/env";

const baseApi = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  validateStatus: () => true,
});

export const setupAxiosInterceptors = (
  getToken: () => Promise<null | string>,
) => {
  baseApi.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
};

// INFO: this is usefull in react-query usage when dealing with isError prop
export const parseResponseToResult = async <T>(
  data: any,
  schema: ZodType<T>,
): Promise<Result<T>> => {
  const request = await ResponseSchema.safeParseAsync(data);
  if (!request.success) {
    return Result.err(new Error("Response is of unexpected structure!"));
  }

  if (request.data.status === "fail") {
    return Result.err(new Error(request.data.message));
  }

  const requestBody = await schema.safeParseAsync(request.data.data);
  if (!requestBody.success) {
    return Result.err(
      new Error(`Parsing data failed!\n${requestBody.error.message}`),
    );
  }

  return Result.ok(requestBody.data);
};

// INFO: this could be usefull when calling the API directly, like from backend
export const parseResponseUnsafe = async <T>(
  data: any,
  schema: ZodType<T>,
): Promise<T> => {
  const request = await ResponseSchema.safeParseAsync(data);
  if (!request.success) {
    throw new Error("Response is of unexpected structure!");
  }

  if (request.data.status === "fail") {
    throw new Error(request.data.message);
  }

  const requestBody = await schema.safeParseAsync(request.data.data);
  if (!requestBody.success) {
    throw new Error(`Parsing data failed!\n${requestBody.error.message}`);
  }

  return requestBody.data;
};

export default baseApi;
