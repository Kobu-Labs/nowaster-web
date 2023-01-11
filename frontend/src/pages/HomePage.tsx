import { FC } from "react";
import Navbar from "../components/Navbar";
import GroupCreator from "../components/GroupCreator";
import GroupJoiner from "../components/GroupJoiner";

export const HomePage: FC = () => {
  return (
    <div className="flex">
      <div className="h-screen sticky top-0">
        <Navbar />
      </div>
      <div className="flex flex-col items-center justify-center w-full">
        <div className="my-4">
          <GroupCreator />
        </div>
        <div className="my-4">
          <GroupJoiner/>
        </div>
      </div>
    </div>

  );
};
