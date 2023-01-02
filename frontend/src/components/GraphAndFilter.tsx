import { FC, useEffect, useState } from "react";
import PieGraph, { PieChartProp } from "../components/PieGraph";
import { ScheduledEntityApi } from "../services";
import useAuth from "../hooks/useAuth";
import CustomizeGraph from "../components/CustomizeGraph";
import pastelColors from "../assets/colors";
import { processPieChartData } from "../utils/GraphDataProcessor";
import { GraphDataSingle } from "../pages/StatsPage";

export const GraphAndFilter: FC = () => {
  const { auth } = useAuth();
  const [scheduledEntities, setScheduledEntities] = useState<GraphDataSingle[]>(
    []
  );
  const [graphProps, setGraphProps] = useState<PieChartProp[]>([]);
  const [filteredData, setFilteredData] = useState<GraphDataSingle[]>([]);
  const [graphData, setGraphData] = useState<GraphDataSingle[]>([]);

  useEffect(() => {
    ScheduledEntityApi.getByUser({ userId: auth!.data.id }).then((values) => {
      const graphData = values.data
        .map((value) => {
          return {
            id: value.id,
            name: value.category,
            duration:
              (value.endTime.getTime() - value.startTime.getTime()) / 1000,
            startDate: value.startTime,
            endDate: value.endTime,
            fill: pastelColors[Math.floor(Math.random() * pastelColors.length)],
          };
        })
        .reduce((result: GraphDataSingle[], current: GraphDataSingle) => {
          const existingIndex = result.findIndex(
            (item) => item.name === current.name
          );
          if (existingIndex !== -1) {
            result[existingIndex].duration += current.duration;
          } else {
            result.push(current);
          }
          return result;
        }, []);
      setGraphData(graphData);

      setFilteredData(graphData);
    });
  }, [auth]);

  useEffect(() => {
    setScheduledEntities(graphData);
    const graphProps = filteredData.map((x) => ({
      name: x.name,
      value: x.duration,
      fill: x.fill,
    }));

    setGraphProps(processPieChartData(graphProps, 0.05));
  }, [filteredData, graphData]);

  return (
    <div className="bg-gray-900 rounded-lg p-8 pt-0 flex items-center">
      <div className="h-[80vh] w-[100vh]">
        <PieGraph data={graphProps}></PieGraph>
      </div>
      <CustomizeGraph
        pieGraphProps={scheduledEntities}
        filteredData={filteredData}
        setFilteredData={setFilteredData}
        showChangeColor={true}
      ></CustomizeGraph>
    </div>
  );
};
