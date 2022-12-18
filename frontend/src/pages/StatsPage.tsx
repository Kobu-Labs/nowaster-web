import { FC, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PieGraph, { PieChartProp } from "../components/PieGraph";
import { ScheduledEntityApi } from "../services";
import useAuth from "../hooks/useAuth";
import CustomizeGraph from "../components/CustomizeGraph";
import pastelColors from "../assets/colors";

export type GraphDataSingle = {
  startDate: Date;
  endDate: Date;
  duration: number;
  name: string;
  fill?: string;
};

export const StatsPage: FC = () => {
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
      console.log("BE request !");

      setFilteredData(graphData);
    });
  }, [auth]);

  useEffect(() => {
    console.log(graphData);

    setScheduledEntities(graphData);
    const graphProps = filteredData.map((x) => ({
      name: x.name,
      value: x.duration,
      fill: x.fill,
    }));

    setGraphProps(graphProps);
  }, [filteredData, graphData]);

  return (
    <div className="flex">
      <div className="h-screen sticky top-0">
        <Navbar />
      </div>
      <div className="flex-grow overflow-y-auto flex items-center justify-center flex-col h-screen">
        <div className="bg-gray-900 rounded-lg p-8 pt-0 flex items-center">
          <div className="h-[80vh] w-[80vh]">
            <PieGraph data={graphProps}></PieGraph>
          </div>
          <CustomizeGraph
            pieGraphProps={scheduledEntities}
            setFilteredData={setFilteredData}
          ></CustomizeGraph>
        </div>
      </div>
    </div>
  );
};
