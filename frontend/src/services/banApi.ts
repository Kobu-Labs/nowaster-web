import baseApi from "./baseApi";
import { ResponseMulti, ResponseSingle } from "./types";
import { Ban, CreateBanData, GetBansByUserEmailData } from "../models/Ban";

export const create = async (
  banData: CreateBanData
): Promise<ResponseSingle<Ban>> => {
  const resp = await baseApi.post<ResponseSingle<Ban>>("ban/", banData);
  return resp.data;
};

export const getByUserEmail = async (
  getBansByUserEmailData: GetBansByUserEmailData
): Promise<ResponseMulti<Ban>> => {
  const resp = await baseApi.get<ResponseMulti<Ban>>(
    "/ban/" + getBansByUserEmailData.email
  );
  return resp.data;
};
