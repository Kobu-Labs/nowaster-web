import baseApi from "./baseApi";
import { UserRegistrationSubmit } from "../validation/registrationSubmit";
import { User } from "../models/user";

type RegistrationResponse = {
    message: string;
    user: User;
}

export const register = async (registrationData : UserRegistrationSubmit) => {
  //change avatar property value
  const resp = await baseApi.put<RegistrationResponse>('user/create', {...registrationData, ...{avatar: "test"}});
  return resp;
}
