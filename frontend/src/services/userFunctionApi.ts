import baseApi from "./baseApi";
import { ResponseMulti, ResponseSingle } from "./types";
import { z } from "zod";
import { UserFunction } from "../models/UserFunction";

const getUserFunctionsSchema = z.object({
    userId: z.string().uuid()
})

export type GetUserFunctionsByUser = z.infer<typeof getUserFunctionsSchema>;

export const getByUser = async (params: GetUserFunctionsByUser): Promise<ResponseMulti<UserFunction>> => {
    const resp = await baseApi.get<ResponseMulti<UserFunction>>("/function/user/" + params.userId);
    return resp.data;
};

const getUserFunctionByNameSchema = z.object({
    userId: z.string().uuid(),
    name: z.string(),
})

export type GetUserFunctionByName = z.infer<typeof getUserFunctionByNameSchema>;

export const getByName = async (params: GetUserFunctionByName): Promise<ResponseSingle<UserFunction | null>> => {
    const resp = await baseApi.get<ResponseSingle<UserFunction | null>>("/function/name/", { params: { name: params.name, userId: params.userId } });
    return resp.data;
};



