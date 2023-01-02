import baseApi from "./baseApi";
import { UserRegistrationSubmit } from "../validation/registrationSubmit";
import { User } from "../models/user";
import { ResponseMulti, ResponseSingle } from "./types";

export const register = async (
  registrationData: UserRegistrationSubmit
): Promise<ResponseSingle<User>> => {
  const resp = await baseApi.put<ResponseSingle<User>>("user/create", {
    ...registrationData,
  });
  return resp.data;
};

export const getAll = async (): Promise<ResponseMulti<User>> => {
  const resp = await baseApi.get<ResponseMulti<User>>("user");
  return resp.data;
};
