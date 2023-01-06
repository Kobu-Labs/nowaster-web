import baseApi from "./baseApi";
import { UserRegistrationSubmit } from "../validation/registrationSubmit";
import { User } from "../models/user";
import { ResponseMulti, ResponseSingle } from "./types";
import { z } from "zod";

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


export const readSingleUserSchema = z.object({
    id: z.string().uuid(),
});

export type GetUserByIdParams = z.infer<typeof readSingleUserSchema>;

export const getById = async (params: GetUserByIdParams): Promise<ResponseSingle<User>> => {
    const resp = await baseApi.get<ResponseSingle<User>>("/user" + params.id);
    return resp.data;
}
