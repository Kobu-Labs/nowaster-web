import { FC, useState } from "react";
import Navbar from "../components/Navbar";
import GroupsNav from "../components/GroupsNav";
import PieGraph from "../components/PieGraph";
import { ChangeColor } from "../components/ChangeColor";
import GroupDetails from "../components/GroupDetails";
import SearchBar from "../components/SearchBar";

export const GroupsPage: FC = () => {
  const data01 = [
    {
      name: "PB151",
      value: 400,
      fill: "red",
    },
    {
      name: "PB138",
      value: 300,
    },
    {
      name: "PB161",
      value: 300,
    },
    {
      name: "MB143",
      value: 200,
    },
    {
      name: "IB110",
      value: 278,
    },
    {
      name: "IB000",
      value: 189,
    },
  ];

  const [group, setGroup] = useState("0");

  return (
    <div className="flex">
      <aside className="h-screen sticky top-0">
        <Navbar />
      </aside>
      <div className="flex-grow overflow-y-auto flex justify-center flex-col h-screen">
        <div className="m-8 bg-gray-900 p-4 rounded-lg pb-8">
          <div className="flex bg-gray-800 rounded-lg px-2 pt-2">
            <GroupsNav setActiveGroup={setGroup}></GroupsNav>
            <SearchBar></SearchBar>
          </div>

          <div className="flex justify-around mt-10">
            <div className="flex flex-col justify-around w-[60vh]">
              <PieGraph data={data01}></PieGraph>
              <ChangeColor></ChangeColor>
            </div>
            <div className="mr-16">
              <GroupDetails groupId={group} groupName={group}></GroupDetails>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
