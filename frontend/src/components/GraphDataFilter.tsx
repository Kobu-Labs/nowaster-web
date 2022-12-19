import React, { useState } from "react";
import { filterPieGraphProps } from "../utils/GraphFilter";

type FilterCriteria = {
  startDate?: Date;
  endDate?: Date;
  maxDuration?: number;
  minDuration?: number;
  name?: string;
};

type GraphDataSingle = {
  startDate: Date;
  endDate: Date;
  duration: number;
  name: string;
};

const PieGraphFilter: React.FC<{
  pieGraphProps: GraphDataSingle[];
  setFilteredData: (data: GraphDataSingle[]) => void;
}> = ({ pieGraphProps, setFilteredData }) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [maxDuration, setMaxDuration] = useState<number | undefined>(undefined);
  const [minDuration, setMinDuration] = useState<number | undefined>(undefined);
  const [name, setName] = useState<string>("");

  const handleFilter = () => {
    const filterCriteria: FilterCriteria = {
      startDate,
      endDate,
      maxDuration,
      minDuration,
      name: name.trim() !== "" ? name.trim() : undefined,
    };

    filterPieGraphProps(pieGraphProps, filterCriteria, setFilteredData);
    console.log("filtering");
    console.log(pieGraphProps);
  };

  return (
    <div className="bg-gray-800 rounded-lg flex flex-col items-center text-center">
      <h2 className="text-xl m-2 mb-4 text-center">Filter data</h2>

      <div className="flex">
        <div className="m-4">
          <label htmlFor="startDate" className="block font-semibold mb-2">
            From Date:
          </label>
          <input
            type="date"
            id="startDate"
            className="w-44 bg-gray-900 rounded-lg px-3 py-2"
            value={startDate ? startDate.toISOString().split("T")[0] : ""}
            onChange={(e) => setStartDate(new Date(e.target.value))}
          />
        </div>

        <div className="m-4">
          <label htmlFor="endDate" className="block font-semibold mb-2">
            To Date:
          </label>
          <input
            type="date"
            id="endDate"
            className="w-44 bg-gray-900 rounded-lg px-3 py-2"
            value={endDate ? endDate.toISOString().split("T")[0] : ""}
            onChange={(e) => setEndDate(new Date(e.target.value))}
          />
        </div>
      </div>

      <div className="m-4">
        <label htmlFor="min-duration" className="block font-semibold mb-2">
          Min Duration:
        </label>
        <input
          type="number"
          id="min-duration"
          placeholder="*hours"
          className=" bg-gray-900 rounded-lg px-3 py-2 text-center"
          value={minDuration !== undefined ? minDuration.toString() : ""}
          onChange={(e) => setMinDuration(parseInt(e.target.value))}
        />
      </div>

      <div className="m-4">
        <label htmlFor="max-duration" className="block font-semibold mb-2">
          Max Duration:
        </label>
        <input
          type="number"
          id="max-duration"
          placeholder="*hours"
          className=" bg-gray-900 rounded-lg px-3 py-2 text-center"
          value={maxDuration !== undefined ? maxDuration.toString() : ""}
          onChange={(e) => setMaxDuration(parseInt(e.target.value))}
        />
      </div>

      <div className="m-4">
        <label htmlFor="name" className="block font-semibold mb-2">
          Category:
        </label>
        <input
          type="text"
          id="name"
          className=" bg-gray-900 rounded-lg px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
        onClick={handleFilter}
      >
        Filter
      </button>
    </div>
  );
};

export default PieGraphFilter;
