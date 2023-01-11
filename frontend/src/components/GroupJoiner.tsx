import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuth from "../hooks/useAuth";
import { GroupApi } from "../services";
import Search from "./Search";
import { useState } from "react";
import { Group } from "../models/group";
import { ResponseSingle } from "../services/types";
import { JoinGroupParams, LeaveUserParams, leaveGroup } from "../services/groupApi";

const GroupJoiner = () => {
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const { auth } = useAuth();
  const queryClient = useQueryClient();

  if (auth === undefined) {
    return null;
  }

  const { data: groups } = useQuery({
    queryKey: ["groups3"],
    retry: false,
    queryFn: async () => {
      const result = await GroupApi.getPublicGroups();
      if (result.status === "error") {
        return [];
      }
      return result.data.filter((user) => auth!.data.id != user.id);
    },
    onSuccess: (data) => setSearchResults(data),
  });

  if (searchResults === undefined) {
    return null;
  }

  const { mutateAsync: joinGroup } = useMutation<
        ResponseSingle<Group>,
        unknown,
        JoinGroupParams,
        unknown
    >({
      mutationFn: async (joinData) => await GroupApi.joinGroup(joinData),
      retry: false,
      onSuccess: () => {
        queryClient.invalidateQueries(['groups2']);
        queryClient.invalidateQueries(['groups3']);
      },
    });

  const { mutateAsync: leaveGroup } = useMutation<
        ResponseSingle<Group>,
        unknown,
        LeaveUserParams,
        unknown
     >({
       mutationFn: async (leaveData) => await GroupApi.leaveGroup(leaveData),
       retry: false,
       onSuccess: () => {
         queryClient.invalidateQueries(['groups2']);
         queryClient.invalidateQueries(['groups3']);
       },
     });


  const executeSearch = (term: string): Group[] | null => {
    if (groups === undefined) {
      return [];
    }
    if (!term || term === "") {
      return groups;
    }

    const filteredData = groups.filter((item) =>
      item.groupName.toLowerCase().includes(term.toLowerCase())
    );
    return filteredData;
  };

  const { data: values } = useQuery({
    queryKey: ["groups2"],
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

  const isGroupJoined = (group: Group): boolean => {
    return values ? values.some(userGroup => userGroup.id === group.id) : false;
  };
  
  const onSearchExecuted = (data: Group[] | null): void => {
    setSearchResults(data || []);
  };

  return (
    <div className="max-w-md mx-auto mt-8 bg-gray-900 p-8 rounded-lg min-h-full w-96">
      <Search<Group>
        executeSearch={executeSearch}
        onSearchExecuted={onSearchExecuted}
        placeholder="Search Group"
      />
      <div className="max-h-64 overflow-y-auto mt-4">
        <ul className="space-y-2">
          {searchResults.map((group) => (
            <li key={group.id} className="flex items-center justify-between p-2 px-4 rounded-lg">
              <span className="w-64 text-left">{group.groupName}</span>
              <div>
                {isGroupJoined(group) ? (
                  <button
                    className="px-2 py-1 mr-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                    onClick={() => leaveGroup({ groupId: group.id, UserId: auth!.data.id })}
                  >
                    Leave
                  </button>
                ) : (
                  <button
                    className="px-2 py-1 mr-2 text-sm text-white bg-green-500 rounded hover:bg-green-600"
                    onClick={() => joinGroup({ groupId: group.id, userId: auth!.data.id })}
                  >
                    Join
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

};

export default GroupJoiner;
