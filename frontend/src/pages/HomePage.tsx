import { FC } from "react";
import Navbar from "../components/Navbar";
import GroupCreator from "../components/GroupCreator";

export const HomePage: FC = () => {
  return (
    <div className="flex">
      <div className="h-screen sticky top-0">
        <Navbar />
      </div>
      <div className="flex-grow overflow-y-auto">
        <GroupCreator></GroupCreator>
      </div>
    </div>
  );
};
