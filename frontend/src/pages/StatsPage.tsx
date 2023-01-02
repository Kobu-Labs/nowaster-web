import { FC, useState } from "react";
import Navbar from "../components/Navbar";
import { GraphAndFilter } from "../components/GraphAndFilter";
import { EntitiesList } from "../components/EntitiesListAndFilter";

export type GraphDataSingle = {
  id: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  name: string;
  fill?: string;
};

export const StatsPage: FC = () => {
  const [showGraph, setShowGraph] = useState<boolean>(true);

  const toggleShow = () => {
    setShowGraph(!showGraph);
  };

  return (
    <div className="flex">
      <div className="h-screen sticky top-0">
        <Navbar />
      </div>
      <div className="flex-grow overflow-y-auto flex items-center justify-center flex-col h-screen">
        <div className="bg-gray-900 rounded-lg h-screen my-2">
          {showGraph ? <GraphAndFilter /> : <EntitiesList />}
          <button
            className="m-3 border-solid border-2 rounded-lg hover:bg-gray-900 bg-gray-800"
            onClick={toggleShow}
          >
            Switch to {showGraph ? "List" : "Graph"}
          </button>
        </div>
      </div>
    </div>
  );
};
