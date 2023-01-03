import { useState } from "react";
import { Group } from "../models/group";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GroupApi } from "../services";
import PieGraph, { PieChartProp } from "./PieGraph";
import { DeleteGroupParams, GenerateInviteCodeParams, GroupInvite, KickUserParams, SummaryReport } from "../services/groupApi";
import { ResponseSingle } from "../services/types";
import useAuth from "../hooks/useAuth";
import { User } from "../models/user";


interface GroupDetailsProps {
    group: Group
    setActiveGroup: (group: Group | null) => void;
}
const processSummary = (data: SummaryReport[]): PieChartProp[] => {
    return data.map((item) => {
        return { name: item.user.username, value: item.hours }
    })

}

const GroupDetails = (props: GroupDetailsProps) => {
    const queryClient = useQueryClient()

    const { auth } = useAuth();
    const { data: summary } = useQuery({
        queryKey: ["group", props.group.id],
        retry: false,
        queryFn: async () => await GroupApi.getGroupSummary({ groupId: props.group.id }),
        refetchOnWindowFocus: false,
    });
    const { data: users } = useQuery({
        queryKey: ["users", props.group.id],
        retry: false,
        queryFn: async () => await GroupApi.getUsersOfGroup({ groupId: props.group.id }),
        refetchOnWindowFocus: false,
    });

    const { mutateAsync: generateInvite } = useMutation<ResponseSingle<GroupInvite>, unknown, GenerateInviteCodeParams, unknown>({
        mutationFn: async (inviteData) => await GroupApi.generateInviteCode(inviteData),
        retry: false,
        onSuccess: (data) => {
            if (data.status === "error") {
                alert("Failed to create the invite link: " + data.message)
            } else {
                alert("Your invite code: " + data.data.code)
            }
        }
    });

    const { mutateAsync: deleteGroup } = useMutation<ResponseSingle<Group>, unknown, DeleteGroupParams, unknown>({
        mutationFn: async (params) => await GroupApi.deleteGroup(params),
        retry: false,
        onSuccess: (data) => {
            if (data.status === "error") {
                alert("Failed to delete the group: " + data.message)
            } else {
                alert("Group has been deleted")
                queryClient.invalidateQueries({ queryKey: ['groups'] })
                props.setActiveGroup(null)
            }
        }
    });
    const { mutateAsync: kickUser } = useMutation<ResponseSingle<User>, unknown, KickUserParams, unknown>({
        mutationFn: async (params) => await GroupApi.kickUser(params),
        retry: false,
        onSuccess: (data) => {
            if (data.status === "error") {
                alert("Failed to kick this user" + data.message)
            } else {
                alert("User has been kicked")
                queryClient.invalidateQueries({ queryKey: ['users', props.group.id] })
            }
        }
    });

    return (
        <div className="bg-gray-800 rounded-lg p-4">
            <h1 className="m-4 text-center">{props.group.groupName}</h1>
            <div className="overflow-y-auto max-h-96 bg-gray-900 rounded-lg p-2">
                {users && users.data.map((user) => (
                    <div
                        key={user.id}
                        className="flex items-center justify-between px-4 py-2 w-64"
                    >
                        <span>{user.username + (auth!.data.id === user.id ? " (you)" : user.id === props.group.creatorId ? " (owner)" : "")}</span>
                        {auth!.data.id === props.group.creatorId && user.id !== props.group.creatorId && auth!.data.id !== user.id &&
                            <button
                                onClick={() => kickUser({
                                    groupId: props.group.id,
                                    kickedUserId: user.id,
                                    kickingUserId: auth!.data.id
                                })}
                                className="px-2 py-1 text-sm font-medium text-red-500 hover:text-red-700 bg-gray-950 rounded-lg"
                            >
                                Kick
                            </button>
                        }
                    </div>
                ))}
            </div>
            <div className="bg-gray-900 rounded-lg mt-4 p-4 text-center">
                <h2 className="text-xl m-2">Manage Group Settings</h2>
                <div className="px-4 py-2 flex flex-col">
                    {props.group.inviteOnly &&
                        <button
                            onClick={() => generateInvite({
                                userId: auth!.data.id,
                                groupId: props.group.id
                            })}
                            className="py-1 text-sm font-medium text-red-500 hover:text-red-700 mt-2 bg-gray-950 rounded-lg"
                        >
                            Generate Invite Code
                        </button>
                    }
                    {props.group.creatorId === auth!.data.id &&

                        < button
                            onClick={() => deleteGroup({ id: props.group.id, creatorId: auth!.data.id })}
                            className="py-1 text-sm font-medium text-red-500 hover:text-red-700 mt-2 bg-gray-950 rounded-lg"
                        >
                            Delete group
                        </button>
                    }
                </div>
            </div>
        </div >
    );
};

export default GroupDetails;
