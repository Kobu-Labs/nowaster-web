import baseApi from "./baseApi";
import { UserRegistrationSubmit } from "../validation/registrationSubmit";
import { User } from "../models/user";
import { ResponseSingle } from "../models/response";

export const register = async (
  registrationData: UserRegistrationSubmit
): Promise<ResponseSingle<User>> => {
  const resp = await baseApi.put<ResponseSingle<User>>("user/create", {
    ...registrationData,
    ...{ avatar: "test" },
  });
  return resp.data;
};
