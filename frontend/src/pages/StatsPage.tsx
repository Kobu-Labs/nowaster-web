import { FC } from "react";
import Navbar from "../components/Navbar";

export const StatsPage: FC = () => {
  return (
    <div className="flex">
      <div className="fixed top-0 left-0 h-screen overflow-y-auto ml-4">
        <Navbar />
      </div>
      <div className="flex-grow overflow-y-auto">
        <p className="ml-48">StatsPage</p>
      </div>
    </div>
  );
};
