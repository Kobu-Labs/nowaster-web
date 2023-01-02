import baseApi from "./baseApi";
import { ResponseMulti, ResponseSingle } from "./types";
import { Ban, CreateBanData, GetBansByUserIdData } from "../models/Ban";

export const create = async (
  banData: CreateBanData
): Promise<ResponseSingle<Ban>> => {
  const resp = await baseApi.post<ResponseSingle<Ban>>("ban/", banData);
  return resp.data;
};

export const getByUserId = async (
  getBansByUserIdData: GetBansByUserIdData
): Promise<ResponseMulti<Ban[]>> => {
  const resp = await baseApi.get<ResponseMulti<Ban[]>>(
    "recorded/" + getBansByUserIdData.userId
  );
  return resp.data;
};
