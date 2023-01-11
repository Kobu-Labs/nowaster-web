// getGroupById

import { z } from "zod";
import { Group } from "../models/group";
import { ResponseMulti, ResponseSingle } from "./types";
import baseApi from "./baseApi";
import { User } from "../models/user";

const getGroupsByUserSchema = z.object({
  userId: z.string().uuid(),
})
export type GetGroupsByUserParams = z.infer<typeof getGroupsByUserSchema>;

export const getGroupsByUser = async (params: GetGroupsByUserParams): Promise<ResponseMulti<Group>> => {
  const resp = await baseApi.get<ResponseMulti<Group>>("/group/user/" + params.userId);
  return resp.data
}

const getGroupSummarySchema = z.object({
  groupId: z.string().uuid(),
})


export type GetGroupSummaryParams = z.infer<typeof getGroupSummarySchema>;
export type SummaryReport = {
    user: User,
    hours: number
}
export const getGroupSummary = async (params: GetGroupSummaryParams): Promise<ResponseMulti<SummaryReport>> => {
  const resp = await baseApi.get<ResponseMulti<SummaryReport>>("/group/details/" + params.groupId);
  return resp.data
}

const getUsersOfGroupSchema = z.object({
  groupId: z.string().uuid(),
})


export type GetUsersOfGroupParams = z.infer<typeof getUsersOfGroupSchema>;

export const getUsersOfGroup = async (params: GetUsersOfGroupParams): Promise<ResponseMulti<User>> => {
  const resp = await baseApi.get<ResponseMulti<User>>("/group/users/" + params.groupId);
  return resp.data
}

const kickUserSchema = z.object({
  groupId: z.string().uuid(),
  kickedUserId: z.string().uuid(),
  kickingUserId: z.string().uuid(),
})


export type KickUserParams = z.infer<typeof kickUserSchema>;

export const kickUser = async (params: KickUserParams): Promise<ResponseSingle<User>> => {
  const resp = await baseApi.post<ResponseSingle<User>>("/group/kick/", params);
  return resp.data
}


export const generateInviteCodeSchema = z.object({
  userId: z.string().uuid(),
  groupId: z.string().uuid(),
});
export type GroupInvite = {
    id: string
    groupId: string
    code: string
}
export type GenerateInviteCodeParams = z.infer<typeof generateInviteCodeSchema>;
export const generateInviteCode = async (params: GenerateInviteCodeParams): Promise<ResponseSingle<GroupInvite>> => {
  const resp = await baseApi.post<ResponseSingle<GroupInvite>>("/group/invite/", params);
  return resp.data
}


export const deleteGroupSchema = z.object({
  id: z.string().uuid(),
  creatorId: z.string().uuid(),
});

export type DeleteGroupParams = z.infer<typeof deleteGroupSchema>;
export const deleteGroup = async (params: DeleteGroupParams): Promise<ResponseSingle<Group>> => {
  const resp = await baseApi.delete<ResponseSingle<Group>>("/group", { params: params });
  return resp.data
}

export const createGroupSchema = z.object({
  creatorId: z.string().uuid(),
  groupName: z.string(),
  inviteOnly: z.boolean()
});

export type CreateGroupParams = z.infer<typeof createGroupSchema>;
export const createGroup = async (params: CreateGroupParams): Promise<ResponseSingle<Group>> => {
  const resp = await baseApi.post<ResponseSingle<Group>>("/group", params);
  return resp.data
}

export const joinGroupSchema = z.object({
  userId: z.string().uuid(),
  groupId: z.string().uuid(),
  code: z.string().optional(),
});

export type JoinGroupParams = z.infer<typeof joinGroupSchema>;
export const joinGroup = async (params: JoinGroupParams): Promise<ResponseSingle<Group>> => {
  const resp = await baseApi.put<ResponseSingle<Group>>("/group", params);
  return resp.data;
}

export const getPrivateGroups = async (): Promise<ResponseMulti<Group>> => {
  const resp = await baseApi.get<ResponseMulti<Group>>("/group/private");
  return resp.data;
}
export const getPublicGroups = async (): Promise<ResponseMulti<Group>> => {
  const resp = await baseApi.get<ResponseMulti<Group>>("/group/public");
  return resp.data;
}
export const getAllGroups = async (): Promise<ResponseMulti<Group>> => {
  const resp = await baseApi.get<ResponseMulti<Group>>("/group/all");
  return resp.data;
}

export const LeaveUserSchema = z.object({
  groupId: z.string().uuid(),
  UserId: z.string().uuid(),
});

export type LeaveUserParams = z.infer<typeof LeaveUserSchema>;
export const leaveGroup = async (params: LeaveUserParams): Promise<ResponseSingle<Group>> => {
  const resp = await baseApi.delete<ResponseSingle<Group>>("/group/leave", { params: params });
  return resp.data;
}

// createNewGroup
