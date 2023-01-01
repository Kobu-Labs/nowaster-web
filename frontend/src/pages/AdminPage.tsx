import { FC, useState } from "react";
import Navbar from "../components/Navbar";
import TwoButtonMenu from "../components/TwoButtonMenu";
import UserManager from "../components/UserManager";
import GroupManager from "../components/GroupManager";

export const AdminPage: FC = () => {
  const usersDisplayString = "Manage Users";
  const groupsDisplayString = "Manage Groups";
  const [active, setActive] = useState(usersDisplayString);

  return (
    <div className="flex">
      <div className="h-screen sticky top-0">
        <Navbar />
      </div>
      <div className="flex-grow overflow-y-auto flex items-center justify-center flex-col h-screen">
        <TwoButtonMenu
          setActive={setActive}
          displayStringFirst={usersDisplayString}
          displayStringSecond={groupsDisplayString}
          active={active}
        ></TwoButtonMenu>
        <div className="h-96 bg-gray-800 rounded-lg text-center">
          {active === usersDisplayString ? (
            <UserManager></UserManager>
          ) : (
            <GroupManager></GroupManager>
          )}
        </div>
      </div>
    </div>
  );
};
