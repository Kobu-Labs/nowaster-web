import { FC, useEffect, useState } from "react";
import { ScheduledEntityApi } from "../services";
import useAuth from "../hooks/useAuth";
import pastelColors from "../assets/colors";
import CustomizeGraph from "../components/CustomizeGraph";
import { formatTime } from "../stories/TimerRecorded";
import { GraphDataSingle } from "../pages/StatsPage";
import dayjs from "dayjs";

export const EntitiesList: FC = () => {
  const { auth } = useAuth();
  const [scheduledEntities, setScheduledEntities] = useState<GraphDataSingle[]>(
    []
  );
  const [filteredData, setFilteredData] = useState<GraphDataSingle[]>([]);

  const handleSubmit = async (id: string) => {
    try {
      await ScheduledEntityApi.removeSingle({ id });
      setFilteredData(filteredData.filter((x) => x.id !== id));
    } catch (err) {
      console.log("error deleting");
    }
  };

  useEffect(() => {
    ScheduledEntityApi.getByUser({ userId: auth!.data.id }).then((values) => {
      const entitiesData = values.data.map((value) => {
        return {
          id: value.id,
          name: value.category,
          duration:
            (value.endTime.getTime() - value.startTime.getTime()) / 1000,
          startDate: value.startTime,
          endDate: value.endTime,
          fill: pastelColors[Math.floor(Math.random() * pastelColors.length)],
        };
      });
      setScheduledEntities(entitiesData);
      setFilteredData(entitiesData);
    });
  }, [auth]);

  return (
    <div className="bg-gray-900 rounded-lg px-8 pt-0 flex items-center">
      <div className="h-[90.5vh] w-[100vh] overflow-auto">
        <ul>
          {filteredData.map((entity, index) => (
            <li
              key={index}
              className="m-3 border-solid border-2 rounded-lg border-gray-800 p-3 flex justify-between"
            >
              <div className="flex-initial">
                <h2>{entity.name}</h2>
                <p>
                  From: {dayjs(entity.startDate).format("DD/MM/YYYY HH:mm:ss")}
                </p>
                <p>To: {dayjs(entity.endDate).format("DD/MM/YYYY HH:mm:ss")}</p>
                <p>Duration: {formatTime(Math.round(entity.duration))}</p>
              </div>
              <div className="flex-initial">
                <button
                  onClick={() => handleSubmit(entity.id)}
                  className="rounded-lg  hover:bg-gray-900 bg-gray-800"
                >
                  DELETE
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <CustomizeGraph
        pieGraphProps={scheduledEntities}
        filteredData={filteredData}
        setFilteredData={setFilteredData}
        showChangeColor={false}
      ></CustomizeGraph>
    </div>
  );
};
