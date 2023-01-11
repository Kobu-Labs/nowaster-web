import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Group } from "../models/group";
import useAuth from "../hooks/useAuth";
import { GroupApi } from "../services";
import { ResponseSingle } from "../services/types";
import { CreateGroupParams } from "../services/groupApi";

interface GroupsNavProps {
    setActiveGroup: (group: Group) => void;
}

const GroupsNav = (props: GroupsNavProps) => {
    const [activeGroup, setActiveGroup] = useState<Group>();
    const navbarRef = useRef<HTMLDivElement>(null);
    const { auth } = useAuth()
    if (auth === undefined) {
        return null;
    }
    const { data } = useQuery({
        queryKey: ["groups"],
        retry: false,
        queryFn: async () => await GroupApi.getGroupsByUser({ userId: auth.data.id }),
        refetchOnWindowFocus: false,
    });


    if (data === undefined) {
        return null;
    }

    const handleActiveGroupChange = (group: Group) => {
        setActiveGroup(group)
        props.setActiveGroup(group)
    }

    return (
        <nav className="flex overflow-x-auto w-full" ref={navbarRef}>
            {data.data.map((group, index) => (
                <button
                    key={index}
                    className={`m-1 mb-3 flex-shrink-0 inline-flex items-center px-4 py-2 text-sm font-medium ${group === activeGroup ? "text-blue-600" : "text-white"
                        } hover:text-blue-500 bg-gray-900`}
                    onClick={() => handleActiveGroupChange(group)}
                >
                    {group.groupName}
                </button>
            ))}
        </nav>
    );
};

export default GroupsNav;
