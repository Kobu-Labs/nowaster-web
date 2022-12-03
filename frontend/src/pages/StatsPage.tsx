import { FC } from "react";
import Navbar from "../components/Navbar";
import { PieChart, Pie, Tooltip, LabelList } from "recharts";
import { ChangeColor } from "../components/ChangeColor";

export const StatsPage: FC = () => {
  const data01 = [
    {
      name: "Group A",
      value: 400,
      fill: "red",
    },
    {
      name: "Group B",
      value: 300,
    },
    {
      name: "Group C",
      value: 300,
    },
    {
      name: "Group D",
      value: 200,
    },
    {
      name: "Group E",
      value: 278,
    },
    {
      name: "Group F",
      value: 189,
    },
  ];

  return (
    <div className="flex">
      <div className="fixed top-0 left-0 h-screen overflow-y-auto ml-4">
        <Navbar />
      </div>
      <div className="flex-grow overflow-y-auto flex items-center justify-center flex-col h-screen">
        <p className="">StatsPage</p>
        <div>
          <PieChart width={730} height={500}>
            <Pie
              data={data01}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={220}
              fill="#8884d8"
            >
              <LabelList
                dataKey="name"
                position="outside"
                style={{ fontSize: "1.3rem" }}
              />
              <LabelList
                dataKey="value"
                position="inside"
                style={{ fontSize: "1.3rem" }}
              />
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
        <ChangeColor />
      </div>
    </div>
  );
};
