import { ResponseSchema } from "@/api/definitions";
import { env } from "@/env";
import { getAccessToken, setAuthTokens } from "@/lib/auth";
import { Result } from "@badrap/result";
import axios from "axios";
import type { ZodType } from "zod";

const baseApi = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Global promise to prevent concurrent refresh requests (race-condition safe)
let refreshPromise: Promise<{
  accessToken: string;
  refreshToken: string;
}> | null = null;

export const refreshTokens = async (): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
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

      const newAccessToken = refreshResponse.data?.data?.access_token;
      const newRefreshToken = refreshResponse.data?.data?.refresh_token;

      if (!newAccessToken || !newRefreshToken) {
        throw new Error("Invalid refresh response");
      }

      setAuthTokens(newAccessToken, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Request interceptor: add auth token to all requests
baseApi.interceptors.request.use(async (config) => {
  const impersonationToken =
    typeof window !== "undefined"
      ? localStorage.getItem("impersonation_token")
      : null;

  if (impersonationToken) {
    config.headers["X-Impersonation-Token"] = impersonationToken;
  } else {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: handle 401 errors with token refresh
baseApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = await refreshTokens();
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return baseApi(originalRequest);
      } catch (refreshError) {
        window.location.href = "/sign-in";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
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
