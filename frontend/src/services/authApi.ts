import { User } from "../models/user";
import { ResponseSingle } from "../models/response";
import baseApi from "./baseApi";
import { UserLoginSubmit } from "../validation/registrationSubmit";

type LoginResponse = {
    message: string;
}

export const auth = async () => {
    const resp = await baseApi.get<ResponseSingle<User>>('/auth', {});
    return resp;
}

export const login = async (loginData: UserLoginSubmit) => {
    const resp = await baseApi.post<LoginResponse>('auth/login', { ...loginData } );
    return resp;
}

export const logout = async () => {
    const resp = await baseApi.post<LoginResponse>('auth/logout',);
    return resp;
}
