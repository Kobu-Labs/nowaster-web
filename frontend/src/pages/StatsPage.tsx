import { FC } from "react";
import Navbar from "../components/Navbar";
import { ChangeColor } from "../components/ChangeColor";
import PieGraph from "../components/PieGraph";

export const StatsPage: FC = () => {
  const data01 = [
    {
      name: "PB151",
      value: 400,
      fill: "red",
    },
    {
      name: "PB138",
      value: 300,
    },
    {
      name: "PB161",
      value: 300,
    },
    {
      name: "MB143",
      value: 200,
    },
    {
      name: "IB110",
      value: 278,
    },
    {
      name: "IB000",
      value: 189,
    },
  ];

  return (
    <div className="flex">
      <div className="fixed top-0 left-0 h-screen overflow-y-auto">
        <Navbar />
      </div>
      <div className="flex-grow overflow-y-auto flex items-center justify-center flex-col h-screen">
        <p className="">StatsPage</p>
        <PieGraph data={data01}></PieGraph>
        <ChangeColor />
      </div>
    </div>
  );
};
