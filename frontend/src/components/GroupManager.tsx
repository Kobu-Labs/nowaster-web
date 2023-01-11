import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Group } from "../models/group";
import Search from "./Search";
import { useState } from "react";
import { GroupApi } from "../services";
import useAuth from "../hooks/useAuth";
import { ResponseSingle } from "../services/types";
import { DeleteGroupParams } from "../services/groupApi";


const GroupManager = () => {
    const { auth } = useAuth()
    const [searchResults, setSearchResults] = useState<Group[]>([]);
    const { data: values } = useQuery({
        queryKey: ["groups", auth!.data.id],
        retry: false,
        queryFn: async () => {
            const result = await GroupApi.getGroupsByUser({ userId: auth!.data.id })
            if (result.status === "error") {
                return [];
            }
            return result.data;

        },
        refetchOnWindowFocus: false,
        onSuccess: (data) => { setSearchResults(data) }
    });

    const queryClient = useQueryClient();
    const { mutateAsync: deleteGroup } = useMutation<ResponseSingle<Group>, unknown, DeleteGroupParams, unknown>({
        mutationFn: async (params) => await GroupApi.deleteGroup(params),
        retry: false,
        onSuccess: (data) => {
            if (data.status === "error") {
                alert("Failed to delete the group: " + data.message)
            } else {
                alert("Group has been deleted")
                queryClient.invalidateQueries({ queryKey: ['groups'] })
            }
        }
    });

    const executeSearch = (term: string): Group[] | null => {
        if (values === undefined){
            return []
        }
        if (!term || term === "") {
            return values;
        }


        const filteredData = values.filter((item) =>
            item.groupName.toLowerCase().includes(term.toLowerCase())
        );
        return filteredData;
    };

    const onSearchExecuted = (data: Group[] | null): void => {
        setSearchResults(data || []);
    };

    return (
        <>
            <Search<Group>
                executeSearch={executeSearch}
                onSearchExecuted={onSearchExecuted}
                placeholder="Search Group"
            />
            <div className="max-h-64 overflow-y-auto">
                <ul className="space-y-2">
                    {searchResults.map((group) => (
                        <li
                            key={group.id}
                            className="flex items-center justify-between p-2 px-4 rounded-lg"
                        >
                            <span className="w-64 text-left">{group.groupName}</span>
                            <div>
                                <button
                                    className="px-2 py-1 mr-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                                    onClick={() => deleteGroup({ id: group.id, creatorId: auth!.data.id })}
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                    <li className="w-96 mx-20"></li>
                </ul>
            </div>
        </>
    );
};

export default GroupManager;
