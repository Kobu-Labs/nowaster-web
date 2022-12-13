import { User } from "../models/user";
import baseApi from "./baseApi";
import { UserLoginSubmit } from "../validation/registrationSubmit";
import { ResponseSingle } from "./types";

export type LoginResponse = {
  message: string;
};

export const auth = async () => {
  const resp = await baseApi.get<ResponseSingle<User>>("/auth", {});
  return resp.data;
};

export const login = async (
  loginData: UserLoginSubmit
): Promise<ResponseSingle<LoginResponse>> => {
  const resp = await baseApi.post<ResponseSingle<LoginResponse>>("auth/login", {
    ...loginData,
  });
  return resp.data;
};

export const logout = async () => {
  const resp = await baseApi.post<LoginResponse>("auth/logout");
  return resp.data;
};
