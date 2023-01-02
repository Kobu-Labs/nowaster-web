import { GraphDataSingle } from "../pages/StatsPage";
import { ChangeColor } from "./ChangeColor";
import PieGraphFilter from "./GraphDataFilter";

interface CustomizeGraphProps {
  pieGraphProps: GraphDataSingle[];
  filteredData: GraphDataSingle[];
  setFilteredData: (data: GraphDataSingle[]) => void;
  showChangeColor?: boolean;
}

const CustomizeGraph: React.FC<CustomizeGraphProps> = ({
  pieGraphProps,
  filteredData,
  setFilteredData,
  showChangeColor = false,
}) => {
  return (
    <div className="mt-4 ml-4 bg-gray-800 py-8 rounded-lg text-center">
      {showChangeColor && (
        <h2 className="text-2xl font-bold mb-6">Customize Graph</h2>
      )}
      <PieGraphFilter
        pieGraphProps={pieGraphProps}
        setFilteredData={setFilteredData}
      ></PieGraphFilter>
      <div className="py-4"></div>
      {showChangeColor && (
        <ChangeColor
          pieGraphProps={filteredData}
          setFilteredData={setFilteredData}
        ></ChangeColor>
      )}
    </div>
  );
};

export default CustomizeGraph;
