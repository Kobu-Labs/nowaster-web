import { GraphDataSingle } from "../pages/StatsPage";
import { ChangeColor } from "./ChangeColor";
import PieGraphFilter from "./GraphDataFilter";

const CustomizeGraph: React.FC<{
  pieGraphProps: GraphDataSingle[];
  filteredData: GraphDataSingle[];
  setFilteredData: (data: GraphDataSingle[]) => void;
}> = ({ pieGraphProps, filteredData, setFilteredData }) => {
  return (
    <div className="mt-4 ml-4 bg-gray-800 py-8 rounded-lg text-center">
      <h2 className="text-2xl font-bold mb-6">Customize Graph</h2>
      <PieGraphFilter
        pieGraphProps={pieGraphProps}
        setFilteredData={setFilteredData}
      ></PieGraphFilter>
      <div className="py-4"></div>
      <ChangeColor
        pieGraphProps={filteredData}
        setFilteredData={setFilteredData}
      ></ChangeColor>
    </div>
  );
};

export default CustomizeGraph;
