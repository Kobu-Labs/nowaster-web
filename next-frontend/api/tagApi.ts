import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import type { TagRequest} from "@/api/definitions";
import { TagResponseSchema } from "@/api/definitions";

const BASE_URL = "/tag";

export const readMany = async (
  params?: TagRequest["readMany"],
)=> {
  const { data } = await baseApi.get(BASE_URL, { params: { ...params } });
  return await parseResponseUnsafe(data, TagResponseSchema.readMany);
};

export const create = async (
  params: TagRequest["create"],
)=> {
  const { data } = await baseApi.post(BASE_URL, params);
  return await parseResponseUnsafe(data, TagResponseSchema.create);
};

export const deleteTag = async (
  params: TagRequest["deleteTag"],
) =>{
  const { data } = await baseApi.delete(`${BASE_URL  }/${  params.id}`);
  return await parseResponseUnsafe(data, TagResponseSchema.deleteTag);
};

export const addAllowedCategory = async (
  params: TagRequest["addAllowedCategory"],
)=> {
  const { data } = await baseApi.post(`${BASE_URL  }/category`, params);
  return await parseResponseUnsafe(data, TagResponseSchema.addAllowedCategory);
};

export const update = async (
  params: TagRequest["update"],
)=> {
  const { data } = await baseApi.patch(`${BASE_URL  }/${  params.id}`, {
    allowedCategories: params.allowedCategories,
    color: params.color,
    label: params.label,
  });
  return await parseResponseUnsafe(data, TagResponseSchema.addAllowedCategory);
};

export const removeAllowedCategory = async (
  params: TagRequest["removeAllowedCategory"],
)=> {
  const { data } = await baseApi.post(`${BASE_URL  }/category`, params);
  return await parseResponseUnsafe(data, TagResponseSchema.removeAllowedCategory);
};

export const getById = async (
  params: TagRequest["getById"],
)=> {
  const { data } = await baseApi.get(`${BASE_URL  }/${  params.id}`);
  return await parseResponseUnsafe(data, TagResponseSchema.getById);
};

export const getStatistics = async () => {
  const { data } = await baseApi.get(`${BASE_URL  }/statistics`);
  return await parseResponseUnsafe(data, TagResponseSchema.statistics);
};
