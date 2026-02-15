import { ResponseSchema } from "@/api/definitions";
import { env } from "@/env";
import { clearAuthCookies, setUserFromToken } from "@/lib/auth";
import { Result } from "@badrap/result";
import axios from "axios";
import { z, type ZodType } from "zod";

const baseApi = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

let refreshPromise: null | Promise<string> = null;

export const refreshTokens = async (): Promise<string> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshResponse = await baseApi.post(
        "/auth/refresh",
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const newAccessToken = refreshResponse.data?.data?.access_token as
        | string
        | undefined;

      if (!newAccessToken) {
        throw new Error("Invalid refresh response");
      }

      setUserFromToken(newAccessToken);
      return newAccessToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

baseApi.interceptors.request.use((config) => {
  const impersonationToken
    = globalThis.window === undefined
      ? null
      : localStorage.getItem("impersonation_token");

  if (impersonationToken) {
    config.headers["X-Impersonation-Token"] = impersonationToken;
  }

  return config;
});

baseApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await refreshTokens();
        return await baseApi(originalRequest);
      } catch (refreshError) {
        clearAuthCookies();
        globalThis.location.href = "/sign-in";
        throw refreshError instanceof Error
          ? refreshError
          : new Error(String(refreshError));
      }
    }

    throw error;
  },
);

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
    console.error(z.prettifyError(request.error));
    throw new Error("Response is of unexpected structure!");
  }

  if (request.data.status === "fail") {
    throw new Error(request.data.message);
  }

  const requestBody = await schema.safeParseAsync(request.data.data);
  if (!requestBody.success) {
    console.error(z.prettifyError(requestBody.error));
    throw new Error("Parsing data failed!");
  }

  return requestBody.data;
};

export default baseApi;
