import baseApi from "./baseApi";
import { UserRegistrationSubmit } from "../validation/registrationSubmit";
import { User } from "../models/user";
import { ResponseSingle } from "./types";

export const register = async (
  registrationData: UserRegistrationSubmit
): Promise<ResponseSingle<User>> => {
  const resp = await baseApi.put<ResponseSingle<User>>("user/create", {
    ...registrationData,
  });
  return resp.data;
};
