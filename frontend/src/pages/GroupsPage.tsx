import { FC, useState } from "react";
import Navbar from "../components/Navbar";
import GroupsNav from "../components/GroupsNav";
import GroupDetails from "../components/GroupDetails";
import SearchBar from "../components/SearchBar";
import { Group } from "../models/group";

export const GroupsPage: FC = () => {
    const [activeGroup, setActiveGroup] = useState<Group | null>(null);

    return (
        <div className="flex">
            <aside className="h-screen sticky top-0">
                <Navbar />
            </aside>
            <div className="flex-grow overflow-y-auto flex justify-center flex-col ">
                <div className="m-8 bg-gray-900 p-4 rounded-lg pb-8">
                    <div className="flex bg-gray-800 rounded-lg px-2 pt-2">
                        <GroupsNav setActiveGroup={setActiveGroup}></GroupsNav>

                        <SearchBar></SearchBar>
                    </div>

                    <div className="flex justify-around mt-10">
                        {activeGroup &&
                            <div className="mr-16">
                                <GroupDetails setActiveGroup={setActiveGroup} group={activeGroup} ></GroupDetails>
                            </div>}
                    </div>
                </div>
            </div>
        </div>
    );
};
